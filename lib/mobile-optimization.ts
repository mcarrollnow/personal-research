export interface MobileOptimization {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: 'small' | 'medium' | 'large'
  touchEnabled: boolean
}

export interface ResponsiveBreakpoints {
  mobile: number
  tablet: number
  desktop: number
  largeDesktop: number
}

class MobileOptimizationService {
  private breakpoints: ResponsiveBreakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
    largeDesktop: 1440
  }

  private mediaQueries: MediaQueryList[] = []
  private listeners: Array<(optimization: MobileOptimization) => void> = []

  constructor() {
    // Initialize after component mount to avoid hydration issues
  }

  // Initialize after component mount
  initialize() {
    if (typeof window !== 'undefined') {
      this.initializeMediaQueries()
      this.setupOrientationListener()
    }
  }

  // Initialize media query listeners
  private initializeMediaQueries(): void {
    const queries = [
      `(max-width: ${this.breakpoints.mobile - 1}px)`,
      `(min-width: ${this.breakpoints.mobile}px) and (max-width: ${this.breakpoints.tablet - 1}px)`,
      `(min-width: ${this.breakpoints.tablet}px)`,
      '(orientation: portrait)',
      '(orientation: landscape)'
    ]

    this.mediaQueries = queries.map(query => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', () => this.notifyListeners())
      return mq
    })
  }

  // Setup orientation change listener
  private setupOrientationListener(): void {
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(() => this.notifyListeners(), 100)
    })

    window.addEventListener('resize', () => this.notifyListeners())
  }

  // Get current device optimization info
  getCurrentOptimization(): MobileOptimization {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        screenSize: 'large',
        touchEnabled: false
      }
    }

    const width = window.innerWidth
    const isMobile = width < this.breakpoints.mobile
    const isTablet = width >= this.breakpoints.mobile && width < this.breakpoints.tablet
    const isDesktop = width >= this.breakpoints.tablet

    return {
      isMobile,
      isTablet,
      isDesktop,
      orientation: width > window.innerHeight ? 'landscape' : 'portrait',
      screenSize: this.getScreenSize(width),
      touchEnabled: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }
  }

  // Get screen size category
  private getScreenSize(width: number): 'small' | 'medium' | 'large' {
    if (width < this.breakpoints.mobile) return 'small'
    if (width < this.breakpoints.desktop) return 'medium'
    return 'large'
  }

  // Subscribe to optimization changes
  subscribe(callback: (optimization: MobileOptimization) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    const optimization = this.getCurrentOptimization()
    this.listeners.forEach(callback => callback(optimization))
  }

  // Optimize admin chat interface for mobile
  optimizeAdminChatForMobile(): {
    containerClass: string
    headerClass: string
    sidebarClass: string
    messageClass: string
    inputClass: string
  } {
    const opt = this.getCurrentOptimization()

    return {
      containerClass: opt.isMobile 
        ? 'flex flex-col h-screen max-h-screen overflow-hidden'
        : 'flex h-screen',
      
      headerClass: opt.isMobile
        ? 'flex-shrink-0 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
        : 'flex-shrink-0 p-4 border-b',
      
      sidebarClass: opt.isMobile
        ? 'hidden' // Hide sidebar on mobile, show via toggle
        : opt.isTablet
        ? 'w-64 flex-shrink-0'
        : 'w-80 flex-shrink-0',
      
      messageClass: opt.isMobile
        ? 'text-sm leading-relaxed p-3 rounded-lg max-w-[85%]'
        : 'text-sm leading-relaxed p-4 rounded-lg max-w-[70%]',
      
      inputClass: opt.isMobile
        ? 'min-h-[44px] text-base' // iOS recommended touch target size
        : 'min-h-[40px] text-sm'
    }
  }

  // Get mobile-optimized admin dashboard layout
  getMobileDashboardLayout(): {
    gridClass: string
    cardClass: string
    statsClass: string
    chartClass: string
  } {
    const opt = this.getCurrentOptimization()

    return {
      gridClass: opt.isMobile
        ? 'grid grid-cols-1 gap-4'
        : opt.isTablet
        ? 'grid grid-cols-2 gap-6'
        : 'grid grid-cols-3 gap-6',
      
      cardClass: opt.isMobile
        ? 'p-4 rounded-lg border bg-card text-card-foreground shadow-sm'
        : 'p-6 rounded-lg border bg-card text-card-foreground shadow-sm',
      
      statsClass: opt.isMobile
        ? 'grid grid-cols-1 gap-3'
        : opt.isTablet
        ? 'grid grid-cols-2 gap-4'
        : 'grid grid-cols-4 gap-6',
      
      chartClass: opt.isMobile
        ? 'h-64 w-full'
        : opt.isTablet
        ? 'h-80 w-full'
        : 'h-96 w-full'
    }
  }

  // Optimize touch interactions for mobile admin features
  getTouchOptimizations(): {
    buttonSize: string
    spacing: string
    fontSize: string
    iconSize: string
  } {
    const opt = this.getCurrentOptimization()

    if (!opt.touchEnabled) {
      return {
        buttonSize: 'h-10 px-4',
        spacing: 'space-y-2',
        fontSize: 'text-sm',
        iconSize: 'w-4 h-4'
      }
    }

    return {
      buttonSize: opt.isMobile ? 'h-12 px-6' : 'h-11 px-5', // Larger touch targets
      spacing: opt.isMobile ? 'space-y-4' : 'space-y-3',
      fontSize: opt.isMobile ? 'text-base' : 'text-sm',
      iconSize: opt.isMobile ? 'w-6 h-6' : 'w-5 h-5'
    }
  }

  // Check if device needs mobile-specific features
  needsMobileFeatures(): boolean {
    const opt = this.getCurrentOptimization()
    return opt.isMobile || opt.touchEnabled
  }

  // Get mobile navigation configuration
  getMobileNavigation(): {
    showBottomNav: boolean
    collapseSidebar: boolean
    useHamburgerMenu: boolean
    stackNavigation: boolean
  } {
    const opt = this.getCurrentOptimization()

    return {
      showBottomNav: opt.isMobile,
      collapseSidebar: opt.isMobile || opt.isTablet,
      useHamburgerMenu: opt.isMobile,
      stackNavigation: opt.isMobile
    }
  }

  // Optimize message input for mobile keyboards
  getMessageInputOptimizations(): {
    inputMode: string
    autoComplete: string
    spellCheck: boolean
    autoCapitalize: string
    enterKeyHint: string
  } {
    const opt = this.getCurrentOptimization()

    if (!opt.isMobile) {
      return {
        inputMode: 'text',
        autoComplete: 'off',
        spellCheck: true,
        autoCapitalize: 'sentences',
        enterKeyHint: 'send'
      }
    }

    return {
      inputMode: 'text',
      autoComplete: 'off',
      spellCheck: true,
      autoCapitalize: 'sentences',
      enterKeyHint: 'send'
    }
  }

  // Get performance optimizations for mobile
  getPerformanceOptimizations(): {
    lazyLoading: boolean
    virtualScrolling: boolean
    imageOptimization: boolean
    reduceAnimations: boolean
  } {
    const opt = this.getCurrentOptimization()

    return {
      lazyLoading: opt.isMobile, // Enable lazy loading on mobile to save bandwidth
      virtualScrolling: opt.isMobile, // Use virtual scrolling for long lists
      imageOptimization: opt.isMobile, // Optimize images for mobile
      reduceAnimations: false // Keep animations for better UX
    }
  }

  // Test mobile responsiveness
  async testMobileResponsiveness(): Promise<{
    passed: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Test touch target sizes
    const buttons = document.querySelectorAll('button, [role="button"]')
    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        issues.push(`Button ${index + 1} is smaller than recommended 44px touch target`)
        recommendations.push('Increase button size for better mobile accessibility')
      }
    })

    // Test text readability
    const textElements = document.querySelectorAll('p, span, div')
    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element)
      const fontSize = parseInt(styles.fontSize)
      if (fontSize < 16) {
        issues.push(`Text element ${index + 1} has font size smaller than 16px`)
        recommendations.push('Use minimum 16px font size on mobile to prevent zoom')
      }
    })

    // Test horizontal scrolling
    const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth
    if (hasHorizontalScroll) {
      issues.push('Page has horizontal scrolling on mobile')
      recommendations.push('Ensure all content fits within viewport width')
    }

    // Test viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      issues.push('Missing viewport meta tag')
      recommendations.push('Add viewport meta tag for proper mobile rendering')
    }

    return {
      passed: issues.length === 0,
      issues,
      recommendations
    }
  }

  // Apply mobile-specific CSS classes based on device
  getMobileSpecificClasses(): {
    container: string
    navigation: string
    content: string
    sidebar: string
    modal: string
  } {
    const opt = this.getCurrentOptimization()

    return {
      container: opt.isMobile 
        ? 'mobile-container px-4 py-2' 
        : opt.isTablet 
        ? 'tablet-container px-6 py-4'
        : 'desktop-container px-8 py-6',
      
      navigation: opt.isMobile
        ? 'mobile-nav fixed bottom-0 left-0 right-0 z-50'
        : opt.isTablet
        ? 'tablet-nav fixed left-0 top-0 bottom-0 z-40'
        : 'desktop-nav relative',
      
      content: opt.isMobile
        ? 'mobile-content pb-20' // Account for bottom navigation
        : 'desktop-content',
      
      sidebar: opt.isMobile
        ? 'mobile-sidebar fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full transition-transform duration-300'
        : opt.isTablet
        ? 'tablet-sidebar w-64 flex-shrink-0'
        : 'desktop-sidebar w-80 flex-shrink-0',
      
      modal: opt.isMobile
        ? 'mobile-modal fixed inset-0 z-50 p-4'
        : 'desktop-modal fixed inset-0 z-50 flex items-center justify-center p-8'
    }
  }
}

export const mobileOptimizationService = new MobileOptimizationService()
