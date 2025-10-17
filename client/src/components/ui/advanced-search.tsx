import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Users, X, GraduationCap, Globe } from "lucide-react";
import type { School } from "@shared/schema";

interface AdvancedSearchProps {
  schools: School[];
  onSchoolSelect: (schoolId: string) => void;
  selectedSchool?: string;
}

export default function AdvancedSearch({ schools, onSchoolSelect, selectedSchool }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique countries and years for filters
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(schools.map(s => s.country).filter(Boolean)));
    return uniqueCountries.sort();
  }, [schools]);

  const foundingYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(schools.map(s => s.yearFounded).filter(Boolean)));
    return uniqueYears.sort((a, b) => b - a); // Descending order
  }, [schools]);

  const filteredSchools = useMemo(() => {
    let results = schools;

    // Filter by country
    if (selectedCountry !== "all") {
      results = results.filter(school => school.country === selectedCountry);
    }

    // Filter by founding year
    if (selectedYear !== "all") {
      results = results.filter(school => school.yearFounded === parseInt(selectedYear));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(school => 
        school.name.toLowerCase().includes(term) ||
        school.city?.toLowerCase().includes(term) ||
        school.state?.toLowerCase().includes(term)
      );
    }

    return searchTerm.trim() ? results.slice(0, 8) : results.slice(0, 5);
  }, [schools, searchTerm, selectedCountry, selectedYear]);

  const selectedSchoolData = schools.find(s => s.id === selectedSchool);

  const handleClearSelection = () => {
    onSchoolSelect("");
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedYear("all");
    setIsExpanded(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Selected School Display */}
      {selectedSchoolData && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedSchoolData.logo ? (
                    <img 
                      src={selectedSchoolData.logo.startsWith('/') ? selectedSchoolData.logo : `/${selectedSchoolData.logo}`}
                      alt={`${selectedSchoolData.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white" data-testid="text-selected-school-name">
                    {selectedSchoolData.name}
                  </h3>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1 text-blue-50">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedSchoolData.city}, {selectedSchoolData.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-50">
                      <Calendar className="w-3 h-3" />
                      <span>Est. {selectedSchoolData.yearFounded}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                data-testid="button-clear-school-selection"
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      {!selectedSchoolData && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 text-white" />
            <Input
              placeholder="Search schools by name, city, or state..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              className="pl-10 h-12 text-base bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white placeholder:text-white/50"
              data-testid="input-school-search"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Country Filter */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4 z-10 pointer-events-none" />
              <Select value={selectedCountry} onValueChange={(value) => {
                setSelectedCountry(value);
                setIsExpanded(true);
              }}>
                <SelectTrigger 
                  className="pl-10 h-12 bg-white/10 backdrop-blur-lg border border-white/20 text-white data-testid-select-country"
                  data-testid="select-country"
                >
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent className="bg-blue-600/60 backdrop-blur-lg border border-white/20 text-white">
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Founding Year Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4 z-10 pointer-events-none" />
              <Select value={selectedYear} onValueChange={(value) => {
                setSelectedYear(value);
                setIsExpanded(true);
              }}>
                <SelectTrigger 
                  className="pl-10 h-12 bg-white/10 backdrop-blur-lg border border-white/20 text-white"
                  data-testid="select-founding-year"
                >
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-blue-600/60 backdrop-blur-lg border border-white/20 text-white">
                  <SelectItem value="all">All Years</SelectItem>
                  {foundingYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Results */}
          {isExpanded && (
            <Card className="border-border/50 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardContent className="p-0">
                {filteredSchools.length > 0 ? (
                  <div className="space-y-0">
                    {filteredSchools.map((school, index) => (
                      <button
                        key={school.id}
                        onClick={() => {
                          onSchoolSelect(school.id);
                          setIsExpanded(false);
                          setSearchTerm("");
                        }}
                        className={`w-full p-4 text-left hover-elevate transition-colors ${
                          index !== filteredSchools.length - 1 ? 'border-b border-border/20' : ''
                        }`}
                        data-testid={`button-school-option-${school.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                              {school.logo ? (
                                <img 
                                  src={school.logo.startsWith('/') ? school.logo : `/${school.logo}`}
                                  alt={`${school.name} logo`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{school.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground text-blue-50">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-blue-50" />
                                  <span className="text-blue-50">{school.city}, {school.state}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Est. {school.yearFounded}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-white">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>No schools found matching "{searchTerm}"</p>
                    <p className="text-sm mt-1 text-blue-50">Try adjusting your search terms</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          
        </div>
      )}
    </div>
  );
}