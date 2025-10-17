import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSecureImageUrl } from "@/lib/secure-image";
import { ArrowLeft, Upload, Plus, Trash2, Settings, Eye, BookOpen, FileText, Layers, Send as Publish, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit, Menu, ShoppingCart, LogOut, Home, Undo2, GripVertical, DollarSign, Check, X, AlertCircle, Bell } from "lucide-react";
import type { Notification } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';


// Navigation utility import - placed after other imports
const navigateToSchoolDashboardYears = (setLocation: any) => {
  setLocation("/school-dashboard?tab=years");
};

interface User {
  id: string;
  username: string;
  userType: "school" | "viewer" | "student";
  fullName: string;
}

interface School {
  id: string;
  name: string;
  yearFounded: number;
}

interface YearbookPage {
  id: string;
  yearbookId: string;
  pageNumber: number;
  title: string;
  imageUrl: string;
  pageType: "front_cover" | "back_cover" | "content";
  createdAt: Date;
}

interface TableOfContentsItem {
  id: string;
  yearbookId: string;
  title: string;
  pageNumber: number;
  description?: string;
  createdAt: Date;
}

interface Yearbook {
  id: string;
  schoolId: string;
  year: number;
  title: string;
  isPublished: boolean;
  isInitialized?: boolean; // Tracks if yearbook setup (orientation and upload type) has been completed
  frontCoverUrl?: string;
  backCoverUrl?: string;
  orientation?: string | null; // 'portrait', 'landscape', null (not selected)
  uploadType?: string | null; // 'image', 'pdf', null (not selected)
  price?: string; // Yearbook price as string (e.g., "14.99")
  pages: YearbookPage[];
  tableOfContents: TableOfContentsItem[];
  createdAt: Date;
  publishedAt?: Date;
}

export default function YearbookManage() {
  const [, params] = useRoute("/yearbook-manage/:year");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Drag and drop state
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  // Manual page assignment state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempPageNumber, setTempPageNumber] = useState<number>(0);
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const year = params?.year;
  const schoolId = new URLSearchParams(window.location.search).get("school");
  
  const [user, setUser] = useState<User | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showTOCDialog, setShowTOCDialog] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState<"front_cover" | "back_cover" | "content">("content");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    isProcessingPDF: boolean;
    currentFile: string;
    totalFiles: number;
    currentFileIndex: number;
    pdfPageCount?: number;
  }>({
    isProcessingPDF: false,
    currentFile: "",
    totalFiles: 0,
    currentFileIndex: 0
  });
  const [newTOCItem, setNewTOCItem] = useState({
    title: "",
    pageNumber: null as number | null,
    description: ""
  });
  
  // Track navigation history for back button
  const [hasNavigationHistory, setHasNavigationHistory] = useState(false);
  
  // Track unsaved changes (only for published yearbooks)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTOCItems, setPendingTOCItems] = useState<any[]>([]);
  const [pendingPageUploads, setPendingPageUploads] = useState<any[]>([]);
  
  // Hamburger menu state
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  
  // TOC editing state
  const [editingTOCId, setEditingTOCId] = useState<string | null>(null);
  const [editingTOCData, setEditingTOCData] = useState({
    title: "",
    pageNumber: 1,
    description: ""
  });
  
  // Price management state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [showPriceConfirmDialog, setShowPriceConfirmDialog] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setLocation("/");
    }
    
    // Check if there's navigation history
    setHasNavigationHistory(window.history.length > 1);
  }, [setLocation]);

  const handleBackNavigation = () => {
    // Navigate specifically to school dashboard with years tab active
    navigateToSchoolDashboardYears(setLocation);
  };

  // Fetch school data
  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", schoolId],
    enabled: !!schoolId,
  });

  // Fetch notifications (school users don't get alumni notifications)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user && user?.userType !== "viewer",
    refetchInterval: 30000,
  });

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Notification mutations
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await apiRequest("DELETE", `/api/notifications/user/${user.id}/clear-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "All notifications cleared",
        description: "Your notification history has been cleared.",
      });
    },
  });

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  const handleClearAllNotifications = () => {
    clearAllNotificationsMutation.mutate();
  };

  // Helper function to format relative time
  const formatRelativeTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString();
  };

  // Fetch yearbook data
  const { data: yearbook, isLoading, error: yearbookError } = useQuery<Yearbook>({
    queryKey: ["/api/yearbooks", schoolId, year],
    enabled: !!schoolId && !!year,
    queryFn: async () => {
      const res = await fetch(`/api/yearbooks/${schoolId}/${year}`);
      if (!res.ok) {
        throw new Error("Yearbook not found. Please purchase this year first.");
      }
      return res.json();
    },
    retry: false, // Don't retry failed requests to avoid cache issues
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // Initialize price input when yearbook loads
  useEffect(() => {
    if (yearbook?.price) {
      setPriceInput(yearbook.price);
    }
  }, [yearbook?.price]);

  // Fetch price history
  const { data: priceHistory = [] } = useQuery({
    queryKey: ["/api/yearbooks", yearbook?.id, "price-history"],
    enabled: !!yearbook?.id,
    queryFn: async () => {
      const res = await fetch(`/api/yearbooks/${yearbook?.id}/price-history`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Check if price can be increased (30-day cooldown)
  const { data: canIncreasePrice } = useQuery({
    queryKey: ["/api/yearbooks", yearbook?.id, "can-increase-price"],
    enabled: !!yearbook?.id && isEditingPrice,
    queryFn: async () => {
      const res = await fetch(`/api/yearbooks/${yearbook?.id}/can-increase-price`);
      if (!res.ok) return { canIncrease: true };
      return res.json();
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ yearbookId, price }: { yearbookId: string; price: string }) => {
      const response = await apiRequest("PATCH", `/api/yearbooks/${yearbookId}/price`, {
        price,
        userId: user?.id,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", yearbook?.id, "price-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", yearbook?.id, "can-increase-price"] });
      setIsEditingPrice(false);
      toast({ 
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Price updated successfully",
        description: `Yearbook price is now $${priceInput}`,
      });
    },
    onError: (error: any) => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Failed to update price",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Upload page mutation
  const uploadPageMutation = useMutation({
    mutationFn: async ({ file, pageType, title, yearbookId }: { file: File; pageType: string; title: string; yearbookId: string }) => {
      // Set progress for PDF processing
      if (file.type === 'application/pdf') {
        setUploadProgress(prev => ({ 
          ...prev, 
          isProcessingPDF: true, 
          currentFile: file.name 
        }));
      }
      
      // For covers, always upload immediately to enable replacement, even for published yearbooks
      if (pageType === "front_cover" || pageType === "back_cover") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pageType", pageType);
        formData.append("title", title);
        
        const response = await fetch(`/api/yearbooks/${yearbookId}/upload-page`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (file.type === 'application/pdf') {
            throw new Error(errorData.message || "PDF processing failed. Please ensure the PDF is not password-protected and contains valid pages.");
          }
          throw new Error(errorData.message || "Upload failed");
        }
        
        const result = await response.json();
        
        // Reset PDF processing state
        if (file.type === 'application/pdf') {
          setUploadProgress(prev => ({ ...prev, isProcessingPDF: false }));
        }
        
        return result;
      }
      
      // If yearbook is published, queue content pages for "Save Changes"
      if (yearbook?.isPublished) {
        // Create a local URL for immediate preview
        const tempUrl = URL.createObjectURL(file);
        setPendingPageUploads(prev => [...prev, { 
          file, 
          pageType, 
          title, 
          tempId: Date.now(),
          tempUrl, // Add temp URL for immediate preview
          pageNumber: pageType === "content" ? (yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + prev.filter(p => p.pageType === "content").length + 1 : 0
        }]);
        setHasUnsavedChanges(true);
        return Promise.resolve({ tempId: Date.now() });
      }
      
      // For unpublished yearbooks, upload immediately
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pageType", pageType);
      formData.append("title", title);
      
      const response = await fetch(`/api/yearbooks/${yearbookId}/upload-page`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check for specific PDF_ALREADY_EXISTS error
        if (errorData.error === "PDF_ALREADY_EXISTS") {
          throw new Error(errorData.message || "A PDF has already been uploaded. Please delete existing pages first.");
        }
        
        if (file.type === 'application/pdf') {
          throw new Error(errorData.message || "PDF processing failed. Please ensure the PDF is not password-protected and contains valid pages.");
        }
        
        throw new Error(errorData.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Always refresh UI when covers are uploaded (since they upload immediately)
      // For content pages, only refresh for unpublished yearbooks
      const isCover = variables.pageType === "front_cover" || variables.pageType === "back_cover";
      if (isCover || !yearbook?.isPublished) {
        queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      }
      
      // Reset PDF processing state
      setUploadProgress({
        isProcessingPDF: false,
        currentFile: "",
        totalFiles: 0,
        currentFileIndex: 0
      });
      
      // Check if it was a PDF that got processed into multiple pages
      if (variables.file?.type === 'application/pdf' && data?.pagesCreated) {
        toast({ 
          className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "PDF uploaded successfully!", 
          description: `Extracted ${data.pagesCreated} page${data.pagesCreated > 1 ? 's' : ''} from ${variables.file.name}` 
        });
      } else {
        const uploadType = isCover ? "Cover" : "Page";
        toast({
          className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: `${uploadType} uploaded successfully!` });
      }
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      setShowUploadDialog(false);
      setUploadingFiles([]);
    },
    onError: (error: any) => {
      // Reset PDF processing state
      setUploadProgress({
        isProcessingPDF: false,
        currentFile: "",
        totalFiles: 0,
        currentFileIndex: 0
      });
      
      const errorMessage = error?.message || "Upload failed";
      
      // Show specific message for PDF already exists error
      if (errorMessage.includes("already been uploaded") || errorMessage.includes("delete existing pages")) {
        toast({ 
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "PDF Already Uploaded", 
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({ 
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Upload failed", 
          description: errorMessage.includes("PDF") ? errorMessage : "Please try again.", 
          variant: "destructive" 
        });
      }
    },
  });

  // Add table of contents item mutation
  const addTOCMutation = useMutation({
    mutationFn: async (tocData: typeof newTOCItem) => {
      // If yearbook is published, queue the change for "Save Changes"
      if (yearbook?.isPublished) {
        setPendingTOCItems(prev => [...prev, { ...tocData, tempId: Date.now() }]);
        setHasUnsavedChanges(true);
        return Promise.resolve({ tempId: Date.now() });
      }
      
      // For unpublished yearbooks, add immediately
      return apiRequest("POST", `/api/yearbooks/${yearbook?.id}/table-of-contents`, {
        ...tocData,
        yearbookId: yearbook?.id
      });
    },
    onSuccess: () => {
      if (!yearbook?.isPublished) {
        queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      }
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Table of contents item added!" });
      setShowTOCDialog(false);
      setNewTOCItem({ title: "", pageNumber: null, description: "" });
    },
  });

  // Update TOC item mutation
  const updateTOCMutation = useMutation({
    mutationFn: async ({ tocId, updates }: { tocId: string, updates: any }) => {
      return apiRequest("PATCH", `/api/yearbooks/table-of-contents/${tocId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ 
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Table of contents item updated!" });
      setEditingTOCId(null);
    },
    onError: () => {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Delete TOC item mutation
  const deleteTOCMutation = useMutation({
    mutationFn: async (tocId: string) => {
      return apiRequest("DELETE", `/api/yearbooks/table-of-contents/${tocId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Table of contents item deleted!" });
    },
    onError: () => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Publish yearbook mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/yearbooks/${yearbook?.id}/publish`, {
        isPublished: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ 
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Yearbook published successfully!", description: "Viewers can now access this yearbook." });
    },
    onError: () => {
      toast({ 
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Publish failed", description: "Please ensure you have uploaded front and back covers.", variant: "destructive" });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      // Get the page to be deleted to know its type and page number
      const allPages = yearbook?.pages || [];
      const deletedPage = allPages.find(p => p.id === pageId);
      
      // First delete the page
      await apiRequest("DELETE", `/api/yearbooks/pages/${pageId}`);
      
      // Only renumber if it was a content page (not covers)
      if (deletedPage && deletedPage.pageType === "content") {
        const contentPages = allPages.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber);
        const pagesToRenumber = contentPages.filter(p => p.pageNumber > deletedPage.pageNumber);
        
        // Renumber each page sequentially to close the gap
        for (const page of pagesToRenumber) {
          await apiRequest("PATCH", `/api/yearbooks/pages/${page.id}/reorder`, {
            pageNumber: page.pageNumber - 1
          });
        }
      }
      
      return pageId;
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      const allPages = yearbook?.pages || [];
      const deletedPage = allPages.find(p => p.id === pageId);
      const pageType = deletedPage?.pageType;
      
      if (pageType === "front_cover" || pageType === "back_cover") {
        const coverType = pageType === "front_cover" ? "Front cover" : "Back cover";
        toast({
          className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: `${coverType} deleted successfully!`, description: "You can upload a new one when ready." });
      } else {
        toast({
          className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Page deleted and pages renumbered!" });
      }
    },
    onError: () => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Delete failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Save changes mutation (for published yearbooks)
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      // Apply all pending page uploads
      for (const upload of pendingPageUploads) {
        const formData = new FormData();
        formData.append("file", upload.file);
        formData.append("pageType", upload.pageType);
        formData.append("title", upload.title);
        
        const response = await fetch(`/api/yearbooks/${yearbook?.id}/upload-page`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error(`Upload failed for ${upload.title}`);
      }
      
      // Apply all pending TOC items
      for (const tocItem of pendingTOCItems) {
        await apiRequest("POST", `/api/yearbooks/${yearbook?.id}/table-of-contents`, {
          ...tocItem,
          yearbookId: yearbook?.id
        });
      }
      
      return Promise.resolve();
    },
    onSuccess: () => {
      setPendingPageUploads([]);
      setPendingTOCItems([]);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({ title: "All changes saved successfully!" });
    },
    onError: (error) => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Save failed", description: "Some changes could not be saved. Please try again.", variant: "destructive" });
    },
  });

  // Reorder page mutation
  const reorderPageMutation = useMutation({
    mutationFn: async ({ pageId, newPageNumber }: { pageId: string, newPageNumber: number }) => {
      return apiRequest("PATCH", `/api/yearbooks/pages/${pageId}/reorder`, {
        pageNumber: newPageNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Page order updated successfully!" });
    },
    onError: () => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Failed to reorder page", description: "Please try again.", variant: "destructive" });
    },
  });

  // Manual page swap mutation
  const swapPagesMutation = useMutation({
    mutationFn: async ({ page1Id, page2Id, page1Number, page2Number }: { 
      page1Id: string, page2Id: string, page1Number: number, page2Number: number 
    }) => {
      // Swap the page numbers between two pages
      await Promise.all([
        apiRequest("PATCH", `/api/yearbooks/pages/${page1Id}/reorder`, {
          pageNumber: page2Number
        }),
        apiRequest("PATCH", `/api/yearbooks/pages/${page2Id}/reorder`, {
          pageNumber: page1Number
        })
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Pages swapped successfully!" });
      setEditingPageId(null);
      setTempPageNumber(0);
    },
    onError: () => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Failed to swap pages", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate file types based on uploadType
      const invalidFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        // For PDF upload mode
        if (yearbook?.uploadType === "pdf") {
          // Covers not applicable in PDF mode
          if (selectedPageType !== "content") {
            return true; // Invalid
          }
          // Only PDFs allowed in PDF mode
          return !isPDF;
        }
        
        // For image upload mode (or default)
        // Covers only allow images
        if (selectedPageType !== "content") {
          return !isImage;
        }
        
        // Content pages allow only images in image mode
        return !isImage;
      });
      
      if (invalidFiles.length > 0) {
        const allowedTypes = yearbook?.uploadType === "pdf" 
          ? "PDF files only" 
          : (selectedPageType === "content" ? "images only" : "images only");
        toast({ 
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Invalid file type", 
          description: `For ${selectedPageType === "content" ? "content pages" : "covers"}, please upload ${allowedTypes}.`, 
          variant: "destructive" 
        });
        // Reset file input
        event.target.value = '';
        return;
      }
      
      // Enhanced PDF validation
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      
      // Check PDF file sizes (limit to 50MB per PDF)
      const oversizedPDFs = pdfFiles.filter(file => file.size > 50 * 1024 * 1024);
      if (oversizedPDFs.length > 0) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "PDF file too large",
          description: `PDF files must be under 50MB. Please compress or split larger PDFs.`,
          variant: "destructive"
        });
        event.target.value = '';
        return;
      }
      
      // Check total file sizes (limit to 100MB total)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 100 * 1024 * 1024) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Upload size limit exceeded",
          description: "Total upload size must be under 100MB. Please reduce file sizes or upload fewer files.",
          variant: "destructive"
        });
        event.target.value = '';
        return;
      }
      
      // For front/back covers, only allow single file
      if (selectedPageType !== "content" && files.length > 1) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Multiple files not allowed", description: "Only one file allowed for covers.", variant: "destructive" });
        // Reset file input
        event.target.value = '';
        return;
      }
      
      // Warn about mixing PDFs with images
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (pdfFiles.length > 0 && imageFiles.length > 0) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Mixed file types detected",
          description: "Consider uploading PDFs and images separately for better organization.",
          variant: "default"
        });
      }
      
      // Inform about multiple PDFs
      if (pdfFiles.length > 1) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Multiple PDFs selected",
          description: `${pdfFiles.length} PDFs will be processed. Each PDF page will become a separate yearbook page.`,
          variant: "default"
        });
      }
      
      setUploadingFiles(files);
    }
  };
  
  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (uploadingFiles.length === 0 || !yearbook?.id) return;
    
    // For single files (covers), upload normally
    if (uploadingFiles.length === 1) {
      const title = selectedPageType === "front_cover" ? "Front Cover" : 
                    selectedPageType === "back_cover" ? "Back Cover" : 
                    `Page ${(yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + 1}`;
      
      uploadPageMutation.mutate({
        file: uploadingFiles[0],
        pageType: selectedPageType,
        title,
        yearbookId: yearbook.id
      });
    } else {
      // For multiple files, upload each one sequentially
      for (let i = 0; i < uploadingFiles.length; i++) {
        const file = uploadingFiles[i];
        const pageNumber = (yearbook?.pages?.filter(p => p.pageType === "content")?.length || 0) + i + 1;
        const title = `Page ${pageNumber}`;
        
        try {
          await new Promise((resolve, reject) => {
            uploadPageMutation.mutate({
              file,
              pageType: selectedPageType,
              title,
              yearbookId: yearbook.id
            }, {
              onSuccess: resolve,
              onError: reject
            });
          });
        } catch (error) {
          toast({
            className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
            title: "Upload failed", description: `Failed to upload ${file.name}`, variant: "destructive" });
          break;
        }
      }
    }
  };

  const handleAddTOC = () => {
    addTOCMutation.mutate(newTOCItem);
  };

  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);


  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActivePageId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActivePageId(null);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Check if we're dragging a pending page
    const isPendingDrag = pendingPageUploads.some(p => p.tempId === active.id);
    
    if (isPendingDrag) {
      // Reorder pending pages
      const pendingContent = pendingPageUploads.filter(p => p.pageType === "content");
      const activeIndex = pendingContent.findIndex(p => p.tempId === active.id);
      const overIndex = pendingContent.findIndex(p => p.tempId === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const reordered = arrayMove(pendingContent, activeIndex, overIndex);
        // Update page numbers
        const updatedPending = reordered.map((page, idx) => ({
          ...page,
          pageNumber: (yearbook?.pages?.filter(p => p.pageType === "content").length || 0) + idx + 1
        }));
        setPendingPageUploads(prev => [
          ...prev.filter(p => p.pageType !== "content"),
          ...updatedPending
        ]);
      }
      return;
    }
    
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    
    const activeIndex = contentPages.findIndex(page => page.id === active.id);
    const overIndex = contentPages.findIndex(page => page.id === over.id);
    
    if (activeIndex === -1 || overIndex === -1) {
      return;
    }
    
    // Reorder the pages array
    const reorderedPages = arrayMove(contentPages, activeIndex, overIndex);
    
    // Update page numbers to match new order
    const updates: Array<{pageId: string, newPageNumber: number}> = [];
    reorderedPages.forEach((page, index) => {
      const newPageNumber = index + 1;
      if (page.pageNumber !== newPageNumber) {
        updates.push({ pageId: page.id, newPageNumber });
      }
    });
    
    // Apply all updates
    if (updates.length > 0) {
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Reordering pages...", description: `Updating ${updates.length} page(s)` });
      
      // Execute all updates
      Promise.all(
        updates.map(update => 
          apiRequest("PATCH", `/api/yearbooks/pages/${update.pageId}/reorder`, {
            pageNumber: update.newPageNumber
          })
        )
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
        toast({
          className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Pages reordered successfully!" });
      }).catch(() => {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Failed to reorder pages", description: "Please try again.", variant: "destructive" });
      });
    }
  };

  // Handle manual page number change (swap pages)
  const handleManualPageChange = (pageId: string, newPageNumber: number) => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentPage = contentPages.find(p => p.id === pageId);
    const targetPage = contentPages.find(p => p.pageNumber === newPageNumber);
    
    if (!currentPage || !targetPage || currentPage.id === targetPage.id) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Invalid page number", description: "Please enter a valid page number.", variant: "destructive" });
      setEditingPageId(null);
      setTempPageNumber(0);
      return;
    }
    
    // Swap the pages
    swapPagesMutation.mutate({
      page1Id: currentPage.id,
      page2Id: targetPage.id,
      page1Number: currentPage.pageNumber,
      page2Number: targetPage.pageNumber
    });
  };

  // Start editing page number
  const startEditingPageNumber = (pageId: string, currentPageNumber: number) => {
    setEditingPageId(pageId);
    setTempPageNumber(currentPageNumber);
  };

  // Cancel editing page number
  const cancelEditingPageNumber = () => {
    setEditingPageId(null);
    setTempPageNumber(0);
  };

  // Basic reorder functions using up/down buttons (kept for compatibility)
  const handleReorderPage = (pageId: string, direction: 'up' | 'down') => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentPage = contentPages.find(p => p.id === pageId);
    
    if (!currentPage) return;
    
    const currentIndex = contentPages.findIndex(p => p.id === pageId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetPage = contentPages[currentIndex - 1];
      // Swap page numbers
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
    } else if (direction === 'down' && currentIndex < contentPages.length - 1) {
      const targetPage = contentPages[currentIndex + 1];
      // Swap page numbers
      reorderPageMutation.mutate({ pageId: currentPage.id, newPageNumber: targetPage.pageNumber });
      reorderPageMutation.mutate({ pageId: targetPage.id, newPageNumber: currentPage.pageNumber });
    }
  };

  // Handle left/right page movement
  const handleMovePageLeft = (pageId: string) => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentPage = contentPages.find(p => p.id === pageId);
    
    if (!currentPage) return;
    
    const currentIndex = contentPages.findIndex(p => p.id === pageId);
    
    if (currentIndex > 0) {
      const targetPage = contentPages[currentIndex - 1];
      // Swap with previous page (left movement)
      swapPagesMutation.mutate({
        page1Id: currentPage.id,
        page2Id: targetPage.id,
        page1Number: currentPage.pageNumber,
        page2Number: targetPage.pageNumber
      });
    }
  };

  const handleMovePageRight = (pageId: string) => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    const currentPage = contentPages.find(p => p.id === pageId);
    
    if (!currentPage) return;
    
    const currentIndex = contentPages.findIndex(p => p.id === pageId);
    
    if (currentIndex < contentPages.length - 1) {
      const targetPage = contentPages[currentIndex + 1];
      // Swap with next page (right movement)
      swapPagesMutation.mutate({
        page1Id: currentPage.id,
        page2Id: targetPage.id,
        page1Number: currentPage.pageNumber,
        page2Number: targetPage.pageNumber
      });
    }
  };






  // Update page numbering mutation - renumbers all pages sequentially
  const updateNumberingMutation = useMutation({
    mutationFn: async () => {
      const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
      
      // Renumber all pages sequentially starting from 1
      for (let i = 0; i < contentPages.length; i++) {
        const page = contentPages[i];
        const newPageNumber = i + 1;
        
        if (page.pageNumber !== newPageNumber) {
          await apiRequest("PATCH", `/api/yearbooks/pages/${page.id}/reorder`, {
            pageNumber: newPageNumber
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", schoolId, year] });
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Page numbering updated successfully!" });
    },
    onError: () => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Update failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // Handle update page numbering button click
  const handleUpdatePageNumbering = () => {
    const contentPages = yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || [];
    
    if (contentPages.length === 0) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "No content pages to renumber", variant: "destructive" });
      return;
    }

    // Check if renumbering is needed
    const needsRenumbering = contentPages.some((page, index) => page.pageNumber !== index + 1);
    
    if (!needsRenumbering) {
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Page numbering is already correct" });
      return;
    }

    updateNumberingMutation.mutate();
  };


  const canPublish = yearbook?.pages?.some(p => p.pageType === "front_cover") && 
                    yearbook?.pages?.some(p => p.pageType === "back_cover") &&
                    yearbook?.price && parseFloat(yearbook.price) >= 1.99 && parseFloat(yearbook.price) <= 49.99;

// Sortable Page Component (with drag and drop)
interface SortablePageProps {
  page: YearbookPage;
  index: number;
  onPreview: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  reorderPending: boolean;
  totalPages: number;
  isDragging?: boolean;
  editingPageId: string | null;
  tempPageNumber: number;
  onStartEditingPageNumber: (pageId: string, currentPageNumber: number) => void;
  onCancelEditingPageNumber: () => void;
  onManualPageChange: (pageId: string, newPageNumber: number) => void;
  onMoveLeft: (pageId: string) => void;
  onMoveRight: (pageId: string) => void;
}

function SortablePage({ 
  page, 
  index, 
  onPreview,
  onDelete,
  reorderPending,
  totalPages,
  isDragging = false,
  editingPageId,
  tempPageNumber,
  onStartEditingPageNumber,
  onCancelEditingPageNumber,
  onManualPageChange,
  onMoveLeft,
  onMoveRight
}: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 bg-white/10 backdrop-blur-lg border-white/20 transition-all duration-200 min-w-[160px] aspect-[3/4] flex flex-col hover:bg-white/15 hover:shadow-md ${
        isSortableDragging ? 'shadow-2xl scale-105' : ''
      } ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
      data-testid={`page-item-${page.id}`}
    >
      {/* Page Number and Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {editingPageId === page.id ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white">Page</span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={tempPageNumber}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || page.pageNumber;
                  onStartEditingPageNumber(page.id, newValue);
                }}
                onBlur={() => {
                  if (tempPageNumber !== page.pageNumber && tempPageNumber >= 1 && tempPageNumber <= totalPages) {
                    onManualPageChange(page.id, tempPageNumber);
                  } else {
                    onCancelEditingPageNumber();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    onCancelEditingPageNumber();
                  }
                }}
                className="w-12 h-6 text-xs px-1 bg-white/20 border-white/30 text-white"
                autoFocus
                data-testid={`input-page-number-${page.id}`}
              />
            </div>
          ) : (
            <span 
              className="text-xs font-medium text-white cursor-pointer hover:text-blue-300 transition-colors"
              onClick={() => onStartEditingPageNumber(page.id, page.pageNumber)}
              title="Click to edit page number"
              data-testid={`text-page-number-${page.id}`}
            >
              Page {page.pageNumber}
            </span>
          )}
        </div>
        <div 
          className="cursor-grab hover:cursor-grabbing text-white/60 hover:text-white p-1 rounded"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </div>
      
      {/* Page Image */}
      <div className="flex-1 w-full mb-2 overflow-hidden rounded">
        <img
          src={getSecureImageUrl(page.imageUrl) || ''}
          alt={page.title ?? ''}
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>
     
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft(page.id);
            }}
            className="p-1 h-5 w-5 text-white hover:bg-white/20"
            title="Move page left"
            data-testid={`button-move-left-${page.id}`}
          >
            <ChevronLeft className="h-2 w-2" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight(page.id);
            }}
            className="p-1 h-5 w-5 text-white hover:bg-white/20"
            title="Move page right"
            data-testid={`button-move-right-${page.id}`}
          >
            <ChevronRight className="h-2 w-2" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(page.id);
            }}
            className="p-1 h-5 w-5"
            title="Preview page"
            data-testid={`button-preview-${page.id}`}
          >
            <Eye className="h-2 w-2" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(page.id);
            }}
            className="p-1 h-5 w-5"
            title="Delete page"
            data-testid={`button-delete-${page.id}`}
          >
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Drag overlay component for visual feedback
function DragOverlayPage({ page }: { page: YearbookPage }) {
  return (
    <div
      className="border rounded-lg p-3 bg-white/20 backdrop-blur-lg border-white/30 shadow-lg min-w-[160px] aspect-[3/4] flex flex-col"
    >
      {/* Page Number */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">
            {page.pageNumber ? `Page ${page.pageNumber}` : 'Page'}
          </span>
        </div>
        <GripVertical className="h-3 w-3 text-white/60" />
      </div>
      
      {/* Page Image */}
      <div className="flex-1 w-full mb-2 overflow-hidden rounded">
        <img
          src={getSecureImageUrl(page.imageUrl) || ''}
          alt={page.title ?? ''}
          className="w-full h-full object-cover pointer-events-none opacity-90"
        />
      </div>
     
      {/* Action buttons placeholder */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-white/60">
          Drag to reorder
        </div>
        <div className="flex items-center gap-1 opacity-50">
          <div className="p-1 h-5 w-5 bg-white/10 rounded"></div>
          <div className="p-1 h-5 w-5 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Sortable Pending Page Component
interface PendingPageUpload {
  tempId: string;
  tempUrl: string;
  title: string;
  pageNumber: number;
  pageType: string;
}

function SortablePendingPage({ 
  pendingPage,
  onDelete
}: {
  pendingPage: PendingPageUpload;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pendingPage.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-2 border-orange-300 rounded-lg p-2 bg-orange-50 w-[200px] aspect-[3/4] flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-orange-600 font-medium">Unsaved</span>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3 w-3 text-orange-600" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden rounded mb-2">
        <img
          src={pendingPage.tempUrl || ''}
          alt={pendingPage.title || ''}
          className="w-full h-full object-cover rounded"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-800 truncate">{pendingPage.title}</p>
        <p className="text-xs text-orange-600">Page {pendingPage.pageNumber} (Pending)</p>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="w-full h-6 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}


  if (!user || user.userType !== "school") {
    return <div className="p-4">Access denied. School administrators only.</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading yearbook...</div>;
  }

  if (yearbookError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
              Yearbook Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80">
              This yearbook hasn't been purchased yet. Please purchase this year first to manage it.
            </p>
            <Button
              onClick={() => setLocation("/school-dashboard?tab=years")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-back-to-dashboard"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Main Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-20 animate-float-delayed"></div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen bg-white/5 backdrop-blur-sm">
      {/* Header with Liquid Glass Theme */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-10 w-8 h-8 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute top-3 right-20 w-6 h-6 bg-white rounded-full opacity-5 animate-float-delayed"></div>
            <div className="absolute bottom-2 left-20 w-5 h-5 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute bottom-1 right-10 w-4 h-4 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          </div>
        </div>
        <div className="mx-auto px-2 sm:px-4 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <div className="hidden sm:flex items-center">
                <Button
                  variant="ghost"
                  onClick={handleBackNavigation}
                  disabled={!hasNavigationHistory}
                  className="mr-2 text-white hover:bg-white/20"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              
              {/* Mobile back button */}
              <Button
                variant="ghost"
                onClick={handleBackNavigation}
                disabled={!hasNavigationHistory}
                className="sm:hidden mr-2 text-white hover:bg-white/20"
                size="sm"
                data-testid="button-mobile-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="text-white text-sm" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg sm:text-xl font-semibold text-white">
                  <span className="hidden sm:inline">Yearbook Manager - </span>
                  <span className="sm:hidden">Yearbook - </span>
                  <span className="hidden sm:inline">{school?.name}</span>
                  <span className="sm:hidden">{school?.name?.split(" ")[0]}</span>
                  <span className="ml-1">{year}</span>
                </h1>
                <p className="text-sm text-white/80">
                  {yearbook?.isPublished ? "Published" : "Draft"} • {yearbook?.pages?.length || 0} pages
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-orange-300">• Unsaved changes</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Survey Button */}
              <Button
                onClick={() => setLocation("/survey")}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 shadow-lg"
                data-testid="button-survey"
              >
                <span className="hidden sm:inline">Done testing? Please take this survey</span>
                <span className="sm:hidden">📋 Survey</span>
              </Button>

              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-white hover:bg-white/20"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Hamburger Menu */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                  className="text-white hover:bg-white/20 p-2 bg-white/10 rounded-lg border border-white/20"
                  data-testid="button-hamburger-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown fixed top-16 right-16 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-blue-600/60 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 z-[999999]">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleClearAllNotifications}
                    className="text-white/80 hover:text-white text-xs"
                    data-testid="button-clear-all-notifications"
                  >
                    Clear All
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNotifications(false)}
                  data-testid="button-close-notifications"
                >
                  <X className="h-4 w-4 text-white hover:text-red-500" />
                </Button>
              </div>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white/70">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-white/20 hover:bg-white/10 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-500/20' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkNotificationRead(notification.id);
                    }
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-white/80 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/60 mt-2">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hamburger Menu Dropdown */}
      {showHamburgerMenu && (
        <div className="hamburger-dropdown fixed top-16 right-4 w-48 bg-blue-600/60 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-[999999]">
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/school-dashboard");
              }}
              data-testid="menu-home"
            >
              <Home className="h-4 w-4 mr-3" />
              Home
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/school-settings");
              }}
              data-testid="menu-settings"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/cart");
              }}
              data-testid="menu-cart"
            >
              <ShoppingCart className="h-4 w-4 mr-3" />
              Cart
            </button>
            <div className="border-t border-gray-100"></div>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/40 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                localStorage.removeItem("user");
                setLocation("/");
              }}
              data-testid="menu-logout"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Operations Panel - Horizontal */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Publishing Checklist - Horizontal */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:flex-1 gap-4">
              <h3 className="font-semibold text-white lg:w-40 flex-shrink-0">Publishing Checklist</h3>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    yearbook?.pages?.some(p => p.pageType === "front_cover") ? "bg-green-500" : "bg-gray-300"
                  }`}>
                    {yearbook?.pages?.some(p => p.pageType === "front_cover") && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${
                    yearbook?.pages?.some(p => p.pageType === "front_cover") ? "text-green-400" : "text-white/60"
                  }`}>
                    Front cover
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    yearbook?.pages?.some(p => p.pageType === "back_cover") ? "bg-green-500" : "bg-gray-300"
                  }`}>
                    {yearbook?.pages?.some(p => p.pageType === "back_cover") && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${
                    yearbook?.pages?.some(p => p.pageType === "back_cover") ? "text-green-400" : "text-white/60"
                  }`}>
                    Back cover
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    yearbook?.price && parseFloat(yearbook.price) >= 1.99 && parseFloat(yearbook.price) <= 49.99 ? "bg-green-500" : "bg-gray-300"
                  }`}>
                    {yearbook?.price && parseFloat(yearbook.price) >= 1.99 && parseFloat(yearbook.price) <= 49.99 && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${
                    yearbook?.price && parseFloat(yearbook.price) >= 1.99 && parseFloat(yearbook.price) <= 49.99 ? "text-green-400" : "text-white/60"
                  }`}>
                    Price set
                  </span>
                </div>
                
                <div className="text-xs text-white/60">
                  {canPublish 
                    ? "✓ Ready to publish!" 
                    : "Complete all items to enable publishing."
                  }
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Horizontal */}
            <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
              <Button
                size="sm"
                className="bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105 hover:border-blue-700"
                onClick={() => {
                  if (yearbook?.isPublished) {
                    saveChangesMutation.mutate();
                  } else {
                    publishMutation.mutate();
                  }
                }}
                disabled={yearbook?.isPublished ? 
                  (!hasUnsavedChanges || saveChangesMutation.isPending) : 
                  (!canPublish || publishMutation.isPending)
                }
                data-testid="button-publish-yearbook"
              >
                <Publish className="h-4 w-4 mr-1" />
                {yearbook?.isPublished ? 
                  (hasUnsavedChanges ? "Save" : "Saved") : 
                  "Publish"
                }
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="bg-white-500/40 backdrop-blur-lg border border-whhite shadow-2xl cursor-pointer transition-all hover:bg-white hover:scale-105 hover:border-black text-white hover:text-black"
                onClick={() => {
                  const previewUrl = `/preview/${year}?school=${schoolId}`;
                  window.open(previewUrl, '_blank');
                }}
                disabled={!yearbook || !yearbook.pages || yearbook.pages.length === 0}
                data-testid="button-preview-yearbook"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="bg-white-500/40 backdrop-blur-lg border border-whhite shadow-2xl cursor-pointer transition-all hover:bg-white hover:scale-105 hover:border-black text-white hover:text-black"
                onClick={handleUpdatePageNumbering}
                disabled={!yearbook?.pages?.some(p => p.pageType === "content") || updateNumberingMutation.isPending}
                data-testid="button-update-page-numbering"
              >
                <Layers className="h-4 w-4 mr-1" />
                {updateNumberingMutation.isPending ? "Updating..." : "Update Pages"}
              </Button>
            </div>
            
            {/* Statistics - Horizontal */}
            <div className="flex flex-wrap gap-4 text-sm border-l border-white/20 pl-4 lg:flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-white/80">Pages:</span>
                <span className="text-white font-medium">{yearbook?.pages?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80">TOC:</span>
                <span className="text-white font-medium">{yearbook?.tableOfContents?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80">Status:</span>
                <span className={yearbook?.isPublished ? "text-green-400 font-medium" : "text-orange-400 font-medium"}>
                  {yearbook?.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Price Management & Table of Contents */}
          <div className="w-full lg:w-56 flex-shrink-0 space-y-6">
            {/* Price Management Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </h3>
              </div>
              
              <div className="space-y-3">
                {isEditingPrice ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="price-input" className="text-white/80 text-xs">
                        Price (USD)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                        <Input
                          id="price-input"
                          type="number"
                          step="0.01"
                          min="1.99"
                          max="49.99"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="pl-7 bg-white/10 border-white/30 text-white"
                          data-testid="input-yearbook-price"
                        />
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Range: $1.99 - $49.99
                      </p>
                    </div>

                    {canIncreasePrice && !canIncreasePrice.canIncrease && (
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded p-2">
                        <p className="text-xs text-orange-200 flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{canIncreasePrice.message}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const price = parseFloat(priceInput);
                          if (isNaN(price) || price < 1.99 || price > 49.99) {
                            toast({
                              className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
                              title: "Invalid price",
                              description: "Price must be between $1.99 and $49.99",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const currentPrice = yearbook?.price ? parseFloat(yearbook.price) : 0;
                          const isIncrease = price > currentPrice;
                          
                          // Check if trying to increase within cooldown period
                          if (isIncrease && canIncreasePrice && !canIncreasePrice.canIncrease) {
                            toast({
                              className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
                              title: "Price increase not allowed",
                              description: canIncreasePrice.message,
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Show confirmation dialog for any price change
                          setShowPriceConfirmDialog(true);
                        }}
                        disabled={updatePriceMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-price"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPriceInput(yearbook?.price || "");
                          setIsEditingPrice(false);
                        }}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-2xl font-bold text-white">
                        {yearbook?.price ? `$${yearbook.price}` : "Not Set"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingPrice(true)}
                        className="h-7 px-2 text-white/80 hover:text-white"
                        data-testid="button-edit-price"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {priceHistory && priceHistory.length > 0 && (
                      <div className="border-t border-white/20 pt-3">
                        <p className="text-xs text-white/60 mb-2">Price History</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {priceHistory.slice(0, 3).map((history: any, index: number) => (
                            <div key={index} className="text-xs text-white/70">
                              <div className="flex justify-between">
                                <span>${history.oldPrice} → ${history.newPrice}</span>
                              </div>
                              <div className="text-white/50">
                                {new Date(history.changedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Table of Contents Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Table of Contents</h3>
                <Button
                  
                  className="bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105 hover:border-blue-700 hover"
                  size="sm"
                  onClick={() => setShowTOCDialog(true)}
                  data-testid="button-add-toc-item"
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* Existing TOC items */}
              {yearbook?.tableOfContents?.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg">
                  {editingTOCId === item.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <Input
                        value={editingTOCData.title}
                        onChange={(e) => setEditingTOCData({ ...editingTOCData, title: e.target.value })}
                        placeholder="Title"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={editingTOCData.pageNumber}
                          onChange={(e) => setEditingTOCData({ ...editingTOCData, pageNumber: parseInt(e.target.value) || 1 })}
                          className="text-xs w-20"
                        />
                        <Input
                          value={editingTOCData.description}
                          onChange={(e) => setEditingTOCData({ ...editingTOCData, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="text-xs flex-1"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateTOCMutation.mutate({ tocId: item.id, updates: editingTOCData });
                          }}
                          disabled={!editingTOCData.title || updateTOCMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTOCId(null);
                            setEditingTOCData({ title: "", pageNumber: 1, description: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">{item.title}</p>
                        <p className="text-xs text-blue-50">Content Page {item.pageNumber}</p>
                        {item.description && (
                          <p className="text-xs text-blue-50 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTOCId(item.id);
                            setEditingTOCData({
                              title: item.title,
                              pageNumber: item.pageNumber,
                              description: item.description || ""
                            });
                          }}
                          className="p-1 h-6 w-6"
                          title="Edit item"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTOCMutation.mutate(item.id)}
                          disabled={deleteTOCMutation.isPending}
                          className="p-1 h-6 w-6"
                          title="Delete item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pending TOC items (for published yearbooks) */}
              {pendingTOCItems.map((item) => (
                <div key={item.tempId} className="p-3 border-2 border-orange-300 rounded-lg bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-orange-600">Content Page {item.pageNumber} (Pending)</p>
                      {item.description && (
                        <p className="text-xs text-orange-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingTOCItems(prev => prev.filter(p => p.tempId !== item.tempId));
                        if (pendingTOCItems.length === 1 && pendingPageUploads.length === 0) {
                          setHasUnsavedChanges(false);
                        }
                      }}
                      className="p-1 h-6 w-6 ml-2"
                      title="Remove pending item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!yearbook?.tableOfContents || yearbook.tableOfContents.length === 0) && pendingTOCItems.length === 0 && (
                <p className="text-white/60 text-sm text-center py-4">No items added yet</p>
              )}
            </div>
          </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-lg">
              <div className="p-6 border-b border-white/20">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Yearbook Pages</h2>
                  
                </div>
              </div>

              {/* Cover Pages - Only show in image upload mode */}
              {yearbook?.uploadType !== "pdf" && (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* Front Cover */}
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                    <div className="mb-3">
                      <FileText className="h-8 w-8 text-white/60 mx-auto mb-2" />
                      <h3 className="font-medium text-white">Front Cover</h3>
                      <p className="text-sm text-white/80">Required</p>
                    </div>
                    
                    {yearbook?.pages?.find(p => p.pageType === "front_cover") ? (
                      <div>
                        <img
                          src={getSecureImageUrl(yearbook.pages.find(p => p.pageType === "front_cover")?.imageUrl) || ''}
                          alt="Front Cover"
                          className="w-full h-32 object-cover rounded mb-3 pointer-events-none"
                        />
                        <div className="flex justify-center">
                          <Button
                            className="text-red-500 bg-white-700 backdrop-blur-lg border border-red-500 shadow-2xl cursor-pointer transition-all hover:bg-red-410 hover:scale-105"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const frontCover = yearbook.pages.find(p => p.pageType === "front_cover");
                              if (frontCover) {
                                deletePageMutation.mutate(frontCover.id);
                              }
                            }}
                            data-testid="button-delete-front-cover"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                          
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        
                       className="text-blue-50 bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105 hover:border-blue-700 hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setSelectedPageType("front_cover");
                          setShowUploadDialog(true);
                        }}
                        data-testid="button-upload-front-cover"
                      >
                        <Upload className="h-4 w-4 mr-2 text-blue-50" />
                        Upload Front Cover
                      </Button>
                    )}
                  </div>

                  {/* Back Cover */}
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                    <div className="mb-3">
                      <FileText className="h-8 w-8 text-white/60 mx-auto mb-2" />
                      <h3 className="font-medium text-white">Back Cover</h3>
                      <p className="text-sm text-white/80">Required</p>
                    </div>
                    
                    {yearbook?.pages?.find(p => p.pageType === "back_cover") ? (
                      <div>
                        <img
                          src={getSecureImageUrl(yearbook.pages.find(p => p.pageType === "back_cover")?.imageUrl) || ''}
                          alt="Back Cover"
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <div className="flex justify-center">
                          <Button
                            className="text-red-500 bg-white-700 backdrop-blur-lg border border-red-500 shadow-2xl cursor-pointer transition-all hover:bg-red-410 hover:scale-105"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const backCover = yearbook.pages.find(p => p.pageType === "back_cover");
                              if (backCover) {
                                deletePageMutation.mutate(backCover.id);
                              }
                            }}
                            data-testid="button-delete-back-cover"
                          > <Trash2 className="h-3 w-3 mr-1 text-center" /> 
 </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="text-blue-50 bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105 hover:border-blue-700 hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setSelectedPageType("back_cover");
                          setShowUploadDialog(true);
                        }}
                        data-testid="button-upload-back-cover"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Back Cover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              )}

                {/* Content Pages */}
                <div className="p-4 sm:p-6">
                  <h3 className="font-medium text-white mb-4">Content Pages</h3>
                  
                  {/* Image Upload Mode: Drag-and-drop multi-image management */}
                  {yearbook?.uploadType !== "pdf" && (
                  <>
                  {/* Page Management Instructions */}
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-200 mb-1 font-medium">Page Organization</p>
                    <p className="text-xs text-blue-300">
                      Drag and drop pages to reorder them, or click preview to view a page and delete to remove it.
                    </p>
                  </div>
                  
                  {/* Drag and Drop Grid Layout */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={[
                        ...(yearbook?.pages?.filter(p => p.pageType === "content").sort((a, b) => a.pageNumber - b.pageNumber) || []).map(page => page.id),
                        ...pendingPageUploads.filter(p => p.pageType === "content").map(p => p.tempId)
                      ]}
                      strategy={rectSortingStrategy}
                    >
                      <div 
                        className="grid gap-4 p-4 justify-items-center"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, 200px)',
                          gap: '16px',
                          justifyContent: 'start'
                        }}
                        data-testid="pages-grid"
                      >
                        {/* Render sortable pages */}
                        {yearbook?.pages?.filter(p => p.pageType === "content")
                          .sort((a, b) => a.pageNumber - b.pageNumber)
                          .map((page, index) => (
                            <SortablePage 
                              key={page.id}
                              page={page}
                              index={index}
                              onPreview={(pageId: string) => {
                                setPreviewPageId(pageId);
                                setShowPreviewDialog(true);
                              }}
                              onDelete={(pageId: string) => deletePageMutation.mutate(pageId)}
                              reorderPending={reorderPageMutation.isPending}
                              totalPages={yearbook?.pages?.filter(p => p.pageType === "content").length || 0}
                              isDragging={activePageId === page.id}
                              editingPageId={editingPageId}
                              tempPageNumber={tempPageNumber}
                              onStartEditingPageNumber={startEditingPageNumber}
                              onCancelEditingPageNumber={cancelEditingPageNumber}
                              onManualPageChange={handleManualPageChange}
                              onMoveLeft={handleMovePageLeft}
                              onMoveRight={handleMovePageRight}
                            />
                          ))
                        }
                        
                        {/* Pending content pages (for immediate preview) */}
                        {pendingPageUploads.filter(p => p.pageType === "content").map((pendingPage) => (
                          <SortablePendingPage
                            key={pendingPage.tempId}
                            pendingPage={pendingPage}
                            onDelete={() => {
                              setPendingPageUploads(prev => prev.filter(p => p.tempId !== pendingPage.tempId));
                              URL.revokeObjectURL(pendingPage.tempUrl); // Clean up temp URL
                              if (pendingPageUploads.length === 1) setHasUnsavedChanges(false);
                            }}
                          />
                        ))}
                        
                        {/* Add Page Button */}
                        <div className="border-2 border-dashed border-white/30 rounded-lg p-4 flex items-center justify-center w-[200px] aspect-[3/4]">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedPageType("content");
                              setShowUploadDialog(true);
                            }}
                            className="flex flex-col items-center h-full w-full hover:bg-white/10 transition-all duration-200"
                            data-testid="button-add-page"
                          >
                            <Plus className="h-8 w-8 text-white/60 mb-2" />
                            <span className="text-sm text-white/80">Add Page</span>
                          </Button>
                        </div>
                      </div>
                    </SortableContext>
                    
                    {/* Drag overlay for better visual feedback */}
                    <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
                      {activePageId ? (
                        <DragOverlayPage 
                          page={yearbook?.pages?.find(p => p.id === activePageId)!} 
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                  </>
                  )}
                  
                  {/* PDF Upload Mode: Single PDF upload with auto-extraction */}
                  {yearbook?.uploadType === "pdf" && (
                  <>
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-200 mb-1 font-medium">PDF Upload Mode</p>
                    <p className="text-xs text-blue-300">
                      Upload your complete yearbook as a single PDF file. All pages will be automatically extracted and cannot be reordered.
                    </p>
                  </div>
                  
                  {/* PDF Upload Button */}
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-white/60 mx-auto mb-4" />
                    <h4 className="font-medium text-white mb-2">Upload Complete Yearbook PDF</h4>
                    <p className="text-sm text-white/60 mb-4">Select a PDF file containing all yearbook pages (including covers)</p>
                    <Button
                      className="text-blue-50 bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105"
                      onClick={() => {
                        setSelectedPageType("content");
                        setShowUploadDialog(true);
                      }}
                      data-testid="button-upload-pdf"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF File
                    </Button>
                  </div>
                  
                  {/* Display extracted pages (read-only grid) */}
                  {yearbook?.pages && yearbook.pages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-white mb-4">Extracted Pages ({yearbook.pages.length})</h4>
                    <div 
                      className="grid gap-4 p-4"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, 200px)',
                        gap: '16px',
                        justifyContent: 'start'
                      }}
                    >
                      {yearbook.pages
                        .sort((a, b) => a.pageNumber - b.pageNumber)
                        .map((page, index) => (
                          <div 
                            key={page.id}
                            className="border-2 border-white/20 rounded-lg p-2 bg-white/5"
                          >
                            <img
                              src={getSecureImageUrl(page.imageUrl) || ''}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-auto object-cover rounded mb-2"
                            />
                            <div className="text-center">
                              <p className="text-xs text-white/80">Page {page.pageNumber}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  )}
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) {
          // Reset file input and uploading files when dialog closes
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          setUploadingFiles([]);
        }
      }}>
        <DialogContent
          className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
">
          <DialogHeader>
            <DialogTitle className="text-white">
              Upload {selectedPageType === "front_cover" ? "Front Cover" : 
                      selectedPageType === "back_cover" ? "Back Cover" : "Content Page"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-blue-50">
                Select {selectedPageType === "content" ? "Image or PDF File" : "Image File"}{selectedPageType === "content" ? "s (multiple allowed)" : ""}
              </Label>
              <Input
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                id="file-upload"
                type="file"
                accept={selectedPageType === "content" ? "image/*,.pdf" : "image/*"}
                multiple={selectedPageType === "content"}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-white/50 mt-1">
                {selectedPageType === "content" 
                  ? "You can select multiple images or PDFs for content pages. They will be uploaded in sequence."
                  : "Please upload portrait orientation images only. Recommended resolution: 1200x1600px"
                }
              </p>
            </div>
            
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="p-3 rounded flex justify-between items-center bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
">
                    <div>
                      <p className="text-sm font-medium text-blue-50">{file.name}</p>
                      <p className="text-xs text-blue-50">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeUploadingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
 text-red-500" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadSubmit}
                disabled={uploadingFiles.length === 0 || uploadPageMutation.isPending}
                data-testid="button-upload-files"
              >
                {uploadPageMutation.isPending ? (
                  uploadProgress.isProcessingPDF ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing PDF...</span>
                    </div>
                  ) : (
                    "Uploading..."
                  )
                ) : (
                  `Upload ${uploadingFiles.length > 1 ? `${uploadingFiles.length} Files` : "File"}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table of Contents Dialog */}
      <Dialog open={showTOCDialog} onOpenChange={setShowTOCDialog}>
        <DialogContent className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          >
          <DialogHeader >
            <DialogTitle>Add Table of Contents Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 ">
            <div>
              <Label htmlFor="toc-title">Title</Label>
              <Input
                id="toc-title"
                value={newTOCItem.title}
                onChange={(e) => setNewTOCItem({ ...newTOCItem, title: e.target.value })}
                placeholder=""
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
            </div>
            
            <div>
              <Label htmlFor="toc-page">Content Page Number</Label>
              <Input
                
                id="toc-page"
                type="number"
                min="1"
                max={yearbook?.pages?.filter(p => p.pageType === "content")?.length || 1}
                value={newTOCItem.pageNumber || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTOCItem({ 
                    ...newTOCItem, 
                    pageNumber: value === "" ? null : parseInt(value) || null 
                  });
                }}
                placeholder=""
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
              {!newTOCItem.pageNumber && (
                <p className="text-xs text-gray-500 mt-1">Content page number is required</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Page numbers refer to content pages only (covers are not counted)
              </p>
            </div>
            
            <div>
              <Label htmlFor="toc-description">Description (Optional)</Label>
              <Input
                id="toc-description"
                value={newTOCItem.description}
                onChange={(e) => setNewTOCItem({ ...newTOCItem, description: e.target.value })}
                placeholder=""
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                variant="outline" 
                onClick={() => setShowTOCDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-500/40 backdrop-blur-lg border border-blue-500 shadow-2xl cursor-pointer transition-all hover:bg-blue-410 hover:scale-105 hover:border-blue-7"
                onClick={handleAddTOC}
                disabled={!newTOCItem.title || !newTOCItem.pageNumber || addTOCMutation.isPending}
              >
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
">
          <DialogHeader>
            <DialogTitle className="text-blue-50">Page Preview</DialogTitle>
          </DialogHeader>
          {previewPageId && (() => {
            const previewPage = yearbook?.pages?.find(p => p.id === previewPageId);
            return previewPage ? (
              <div className="flex justify-center">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
">
                  <img
                    src={getSecureImageUrl(previewPage.imageUrl) || ''}
                    alt={previewPage.title ?? ''}
                    className="max-w-full max-h-96 object-contain"
                  />
                  <div className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
">
                    
                    {previewPage.pageType === "content" && (
                      <p className="text-sm font-medium text-blue-50">Page {previewPage.pageNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Page not found</p>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Price Change Confirmation Dialog */}
      <Dialog open={showPriceConfirmDialog} onOpenChange={setShowPriceConfirmDialog}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Price Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/80">
              Are you sure you want to change this yearbook's price? This change cannot be modified again for the next 30 days.
            </p>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded">
              <span className="text-white/80">Current Price:</span>
              <span className="font-semibold text-lg">{yearbook?.price ? `$${yearbook.price}` : "Not Set"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded">
              <span className="text-white/80">New Price:</span>
              <span className="font-semibold text-lg">${priceInput}</span>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  if (yearbook?.id) {
                    updatePriceMutation.mutate({
                      yearbookId: yearbook.id,
                      price: parseFloat(priceInput).toFixed(2),
                    });
                  }
                  setShowPriceConfirmDialog(false);
                }}
                disabled={updatePriceMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-price-change"
              >
                Confirm Change
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPriceConfirmDialog(false)}
                data-testid="button-cancel-price-change"
                className="flex-1 text-red-500 bg-white-700 backdrop-blur-lg border border-red-500 shadow-2xl cursor-pointer transition-all hover:bg-red-410 hover:scale-105 hover:text-red-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}