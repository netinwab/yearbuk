import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart, Eye, CheckCircle, AlertTriangle, Settings, FileImage, FileText, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { CartItem } from "@shared/schema";

interface YearbookConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  price: number;
  schoolId: string;
  userId: string;
  isFree?: boolean;
}

export function YearbookConfigDialog({ 
  isOpen, 
  onClose, 
  year, 
  price, 
  schoolId,
  userId,
  isFree = false
}: YearbookConfigDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { convertPrice, formatPrice } = useCurrency();
  
  const [uploadType, setUploadType] = useState<'image' | 'pdf' | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null);

  const { data: school, isLoading: isLoadingSchool } = useQuery({
    queryKey: ["/api/schools", schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/schools/${schoolId}`);
      if (!res.ok) throw new Error("Failed to fetch school data");
      return res.json();
    },
    enabled: isOpen && !!schoolId
  });

  const hasRevenueSharing = school?.paystackSubaccountCode || school?.bankAccountNumber;

  const addToCartMutation = useMutation({
    mutationFn: async (cartData: { 
      userId: string; 
      schoolId: string; 
      year: number; 
      price: string;
      orientation: string;
      uploadType: string;
    }) => {
      await apiRequest("POST", "/api/cart", cartData);
    },
    onMutate: async (newCartItem) => {
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });
      const previousCartItems = queryClient.getQueryData<CartItem[]>(["/api/cart", userId]);

      const optimisticCartItem: CartItem = {
        id: `temp-${Date.now()}`,
        userId: newCartItem.userId,
        schoolId: newCartItem.schoolId,
        year: newCartItem.year,
        price: newCartItem.price,
        orientation: newCartItem.orientation,
        uploadType: newCartItem.uploadType,
        addedAt: new Date()
      };

      queryClient.setQueryData<CartItem[]>(["/api/cart", userId], (old = []) => [
        ...old,
        optimisticCartItem
      ]);

      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Added to cart!",
        description: `${year} yearbook has been configured and added to your cart.`,
        action: (
          <Button 
            size="sm" 
            onClick={() => setLocation("/cart")}
            className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white"
            data-testid="toast-view-cart"
          >
            View Cart
          </Button>
        )
      });

      return { previousCartItems, optimisticCartItem };
    },
    onError: (error: any, newCartItem, context) => {
      queryClient.setQueryData(["/api/cart", userId], context?.previousCartItems || []);
      
      if (error.message?.includes("already in cart")) {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Already in cart",
          description: "This yearbook is already in your cart.",
          variant: "destructive"
        });
      } else {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Failed to add to cart",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      setUploadType(null);
      setOrientation(null);
      onClose();
    }
  });

  const handleConfirmAndAddToCart = async () => {
    // TEST VERSION: Revenue sharing check disabled for testing
    // if (!hasRevenueSharing) {
    //   toast({
    //     className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
    //     title: "Revenue sharing required",
    //     description: "You must set up revenue sharing before purchasing school years.",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    if (!uploadType || !orientation) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Configuration incomplete",
        description: "Please select both yearbook type and orientation.",
        variant: "destructive"
      });
      return;
    }

    const cartData = {
      userId,
      schoolId,
      year: parseInt(year),
      price: isFree ? "0.00" : price.toString(),
      orientation,
      uploadType
    };

    addToCartMutation.mutate(cartData);
  };

  const handleViewCart = () => {
    onClose();
    setLocation("/cart");
  };

  const handleGoToSettings = () => {
    onClose();
    setLocation("/school-settings?tab=revenue");
  };

  const handleClose = () => {
    setUploadType(null);
    setOrientation(null);
    onClose();
  };

  const isConfigurationComplete = uploadType !== null && orientation !== null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl" data-testid="yearbook-config-dialog">
        <div className="space-y-3">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white text-lg">
              <Settings className="h-5 w-5" />
              <span>Configure {year} Yearbook</span>
            </DialogTitle>
            <DialogDescription className="text-blue-50 text-sm">
              Select your yearbook type and orientation.
            </DialogDescription>
          </DialogHeader>

          {isLoadingSchool ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-4 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* TEST VERSION: Revenue sharing warning disabled for testing */}
              <div className="space-y-3">
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <CardContent className="p-3">
                    <Label className="text-sm font-semibold text-white mb-2 block">
                      Select Yearbook Type
                    </Label>
                    <RadioGroup value={uploadType || ""} onValueChange={(value) => setUploadType(value as 'image' | 'pdf')} className="space-y-2">
                      <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10" data-testid="option-image-upload">
                        <RadioGroupItem value="image" id="image" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="image" className="flex items-center gap-1.5 text-white text-sm font-medium cursor-pointer">
                            <FileImage className="h-4 w-4" />
                            Image Upload (JPG/PNG)
                          </Label>
                          <p className="text-xs text-blue-100 mt-0.5">
                            Upload individual page images.
                          </p>
                        </div>
                      </div>
                      {/* TEST MODE: PDF upload disabled for testing */}
                      <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/10 opacity-50 cursor-not-allowed" data-testid="option-pdf-upload">
                        <RadioGroupItem value="pdf" id="pdf" className="mt-0.5" disabled />
                        <div className="flex-1">
                          <Label htmlFor="pdf" className="flex items-center gap-1.5 text-white text-sm font-medium cursor-not-allowed">
                            <FileText className="h-4 w-4" />
                            PDF Upload
                          </Label>
                          <p className="text-xs text-red-300 mt-0.5">
                            Unavailable in test mode
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <CardContent className="p-3">
                    <Label className="text-sm font-semibold text-white mb-2 block">
                      Choose Page Orientation
                    </Label>
                    <RadioGroup value={orientation || ""} onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')} className="space-y-2">
                      <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10" data-testid="option-landscape">
                        <RadioGroupItem value="landscape" id="landscape" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="landscape" className="flex items-center gap-1.5 text-white text-sm font-medium cursor-pointer">
                            <Monitor className="h-4 w-4 rotate-0" />
                            Landscape
                          </Label>
                          <p className="text-xs text-blue-100 mt-0.5">
                            4:3 Page Format.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10" data-testid="option-portrait">
                        <RadioGroupItem value="portrait" id="portrait" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="portrait" className="flex items-center gap-1.5 text-white text-sm font-medium cursor-pointer">
                            <Monitor className="h-4 w-4 rotate-90" />
                            Portrait
                          </Label>
                          <p className="text-xs text-blue-100 mt-0.5">
                            Traditional 3:4 Page format.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-semibold text-white">{year} Yearbook</h3>
                        <p className="text-xs text-blue-50">
                          {uploadType === 'pdf' ? 'PDF' : uploadType === 'image' ? 'Image' : 'Type not selected'} • {orientation === 'portrait' ? 'Portrait' : orientation === 'landscape' ? 'Landscape' : 'Not selected'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${isFree ? 'text-green-400' : 'text-blue-50'}`}>
                          {isFree ? "FREE" : formatPrice(convertPrice(price))}
                        </div>
                        {isFree && (
                          <p className="text-xs text-green-400 font-medium">First purchase</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <div className="flex space-x-2 pt-2">
            {/* TEST VERSION: Revenue sharing button disabled for testing */}
            {/* {!isLoadingSchool && !hasRevenueSharing ? (
              <Button 
                onClick={handleGoToSettings}
                className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl"
                data-testid="button-setup-revenue"
              >
                <Settings className="h-4 w-4 mr-2" />
                Set Up Revenue Sharing
              </Button>
            ) : ( */}
              <>
                <Button 
                  onClick={handleConfirmAndAddToCart}
                  disabled={!isConfigurationComplete || addToCartMutation.isPending || isLoadingSchool}
                  className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:bg-yellow-100 hover:text-black transition-colors duration-200 ease-in-out disabled:opacity-50"
                  data-testid="button-confirm-add-to-cart"
                >
                  {addToCartMutation.isPending ? (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Confirm and Add to Cart
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleViewCart}
                  variant="outline"
                  className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white hover:bg-white hover:text-black transition-colors duration-200 ease-in-out"
                  data-testid="button-view-cart"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Cart
                </Button>
              </>
          </div>

          {!isFree && (
            <p className="text-xs text-gray-400 text-center">
              * This is a demo. No actual payment will be processed.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
