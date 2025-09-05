'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Copy, Clock, MessageSquare, X } from 'lucide-react'
import { templateService } from '@/lib/template-service'
import type { MessageTemplate, TemplateCategory } from '@/types/admin-chat'

interface MessageTemplatesProps {
  onTemplateSelect?: (template: MessageTemplate) => void
  showQuickReplies?: boolean
  adminId?: string
  className?: string
}

export function MessageTemplates({ 
  onTemplateSelect, 
  showQuickReplies = false, 
  adminId = 'admin-001',
  className = ''
}: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [quickReplies, setQuickReplies] = useState<MessageTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'quick-replies'>('templates')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isGlobal: false
  })

  // Load templates and quick replies
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load templates
        const templatesResult = await templateService.getTemplates(adminId)
        if (templatesResult.success && templatesResult.data) {
          setTemplates(templatesResult.data)
        }

        // Load categories
        const categoriesResult = await templateService.getTemplatesByCategory(adminId)
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        }

        // Load quick replies if needed
        if (showQuickReplies) {
          const quickRepliesResult = await templateService.getQuickReplies(adminId)
          if (quickRepliesResult.success && quickRepliesResult.data) {
            setQuickReplies(quickRepliesResult.data)
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [adminId, showQuickReplies])

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleTemplateSelect = (template: MessageTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
      // Record usage
      templateService.recordTemplateUsage(template.id)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const result = await templateService.createTemplate(
        adminId,
        formData.title,
        formData.content,
        formData.category,
        formData.isGlobal
      )

      if (result.success) {
        // Refresh templates
        const templatesResult = await templateService.getTemplates(adminId)
        if (templatesResult.success && templatesResult.data) {
          setTemplates(templatesResult.data)
        }
        
        setShowCreateModal(false)
        setFormData({ title: '', content: '', category: '', isGlobal: false })
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const handleEditTemplate = async () => {
    if (!editingTemplate) return

    try {
      const result = await templateService.updateTemplate(editingTemplate.id, {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        is_global: formData.isGlobal
      })

      if (result.success) {
        // Refresh templates
        const templatesResult = await templateService.getTemplates(adminId)
        if (templatesResult.success && templatesResult.data) {
          setTemplates(templatesResult.data)
        }
        
        setEditingTemplate(null)
        setFormData({ title: '', content: '', category: '', isGlobal: false })
      }
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const result = await templateService.deleteTemplate(templateId)
      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const openEditModal = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      isGlobal: template.is_global
    })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingTemplate(null)
    setFormData({ title: '', content: '', category: '', isGlobal: false })
  }

  const categoryOptions = categories.map(cat => cat.name.toLowerCase())

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'templates'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates ({templates.length})
          </button>
          {showQuickReplies && (
            <button
              onClick={() => setActiveTab('quick-replies')}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'quick-replies'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Replies ({quickReplies.length})
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          {activeTab === 'templates' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'templates' ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {template.title}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {template.category}
                        </span>
                        {template.is_global && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {template.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Used {template.usage_count} times</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-3">
                      <button
                        onClick={() => handleTemplateSelect(template)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Use template"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit template"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No templates found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleTemplateSelect(reply)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {reply.title}
                </div>
                <div className="text-sm text-gray-600">
                  {reply.content}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Template title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                  <option value="general">General</option>
                  <option value="safety">Safety</option>
                  <option value="dosing">Dosing</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  placeholder="Template content..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isGlobal" className="ml-2 text-sm text-gray-700">
                  Make this template available to all admins
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleEditTemplate : handleCreateTemplate}
                disabled={!formData.title || !formData.content || !formData.category}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
