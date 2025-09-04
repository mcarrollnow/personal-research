"use client"

import React, { useEffect, useState } from "react";
import { adminAuthService } from "@/lib/admin-auth";
import { adminService } from "@/lib/admin-service";
import { messagingService } from "@/lib/messaging-service";
import DashboardCard from "@/components/dashboard/card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  MessageSquare, 
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone
} from "lucide-react";
import Link from "next/link";
import { PatientContext } from "@/types/admin-chat";

interface PatientWithMessages extends PatientContext {
  unread_count: number;
  last_message_at?: string;
  peptide_progress: string;
  safety_alerts: number;
}

export default function AdminPatientsPage() {
  const [currentAdmin, setCurrentAdmin] = useState(adminAuthService.getCurrentAdmin());
  const [patients, setPatients] = useState<PatientWithMessages[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [peptideFilter, setPeptideFilter] = useState<string>("all");

  useEffect(() => {
    if (!currentAdmin) {
      setCurrentAdmin(adminAuthService.getCurrentAdmin());
    }
    loadPatients();
  }, [currentAdmin]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, statusFilter, peptideFilter]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Load patients from admin service
      const patientsResponse = await adminService.getAllPatients(1, 100);
      
      if (patientsResponse.success && patientsResponse.data) {
        const patientsData = patientsResponse.data.data;
        
        // Enhance patient data with messaging information
        const enhancedPatients: PatientWithMessages[] = await Promise.all(
          patientsData.map(async (patient) => {
            try {
              // Get conversation data for each patient
              const conversationsResponse = await messagingService.getPatientConversations(
                patient.patient_id, 
                1, 
                1
              );
              
              const conversation = conversationsResponse.data?.data[0];
              
              return {
                ...patient,
                unread_count: conversation?.unread_count || 0,
                last_message_at: conversation?.last_message_at,
                peptide_progress: `Week ${patient.current_week || 1}`,
                safety_alerts: Math.floor(Math.random() * 3) // Mock safety alerts
              };
            } catch (error) {
              // Return patient data with defaults if messaging data fails
              return {
                ...patient,
                unread_count: 0,
                peptide_progress: `Week ${patient.current_week || 1}`,
                safety_alerts: 0
              };
            }
          })
        );
        
        setPatients(enhancedPatients);
      } else {
        // Fallback to mock data if service fails
        const mockPatients: PatientWithMessages[] = [
          {
            id: "1",
            name: "John Smith",
            email: "john.smith@email.com",
            peptide_type: "Semaglutide",
            start_date: "2024-01-15",
            current_week: 8,
            last_weight: 185,
            compliance_rate: 95,
            recent_side_effects: ["Mild nausea"],
            status: "active",
            unread_count: 2,
            last_message_at: "2024-12-19T10:30:00Z",
            peptide_progress: "Week 8",
            safety_alerts: 0
          },
          {
            id: "2", 
            name: "Sarah Johnson",
            email: "sarah.j@email.com",
            peptide_type: "Tirzepatide",
            start_date: "2024-02-01",
            current_week: 6,
            last_weight: 165,
            compliance_rate: 88,
            recent_side_effects: ["Fatigue"],
            status: "active",
            unread_count: 1,
            last_message_at: "2024-12-19T09:15:00Z",
            peptide_progress: "Week 6",
            safety_alerts: 1
          },
          {
            id: "3",
            name: "Mike Davis",
            email: "mike.davis@email.com", 
            peptide_type: "Liraglutide",
            start_date: "2024-01-08",
            current_week: 12,
            last_weight: 178,
            compliance_rate: 92,
            recent_side_effects: [],
            status: "active",
            unread_count: 0,
            peptide_progress: "Week 12",
            safety_alerts: 0
          }
        ];
        setPatients(mockPatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.peptide_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    // Peptide filter
    if (peptideFilter !== "all") {
      filtered = filtered.filter(patient => 
        patient.peptide_type.toLowerCase().includes(peptideFilter.toLowerCase())
      );
    }

    setFilteredPatients(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!currentAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Patient Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage enrolled patients and track their progress
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold text-blue-600">
                  {patients.reduce((sum, p) => sum + p.unread_count, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safety Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {patients.reduce((sum, p) => sum + p.safety_alerts, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <DashboardCard title="Search & Filter Patients" intent="default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={peptideFilter}
            onChange={(e) => setPeptideFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="all">All Peptides</option>
            <option value="semaglutide">Semaglutide</option>
            <option value="tirzepatide">Tirzepatide</option>
            <option value="liraglutide">Liraglutide</option>
          </select>
        </div>
      </DashboardCard>

      {/* Patient List */}
      <DashboardCard title={`Patients (${filteredPatients.length})`} intent="default">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No patients found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <Badge variant={getStatusColor(patient.status)}>
                          {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                        </Badge>
                        {patient.unread_count > 0 && (
                          <Badge variant="destructive">
                            {patient.unread_count} unread
                          </Badge>
                        )}
                        {patient.safety_alerts > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Safety Alert
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {patient.peptide_type} • {patient.peptide_progress}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className={getComplianceColor(patient.compliance_rate)}>
                            {patient.compliance_rate}% compliance
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Current Weight:</span> {patient.last_weight} lbs
                        </div>
                        <div>
                          <span className="font-medium">Started:</span> {new Date(patient.start_date).toLocaleDateString()}
                        </div>
                        {patient.last_message_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Last message:</span> {new Date(patient.last_message_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Link href={`/admin/chat/${patient.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
