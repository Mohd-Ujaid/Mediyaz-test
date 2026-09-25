"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Dna,
  User,
  Heart,
  Activity,
  Award,
  Layers,
  Clock,
  Filter,
  SlidersHorizontal,
  MapPin,
  X,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INDIAN_STATES, getCitiesForState } from "@/config/indiaLocations";

export interface ArtDonorItem {
  _id: string;
  donorCode: string;
  gameteType: "egg" | "sperm";
  availability: "available" | "quarantine" | "allocated";
  availabilityLabel: string;
  age: number;
  bloodType: string;
  rhFactor: "Positive" | "Negative";
  heightCm: number;
  heightFormatted: string;
  weightKg: number;
  bmi: number;
  eyeColor: string;
  hairColor: string;
  hairTexture: string;
  skinTone: string;
  bodyBuild?: string;
  ethnicity: string;
  ancestryRegion: string;
  state?: string;
  city?: string;
  religion: string;
  motherTongue: string;
  languages: string[];
  educationLevel: string;
  degree: string;
  profession: string;
  provenFertility: string;
  livingChildren: number;
  abortion: number;
  talents?: string[];
  hobbies?: string[];
  donorStatement?: string;
  avatarColor?: string;
  viralMarkers: {
    hiv: string;
    hbsAg: string;
    hcv: string;
    vdrl: string;
  };
  geneticScreenings?: {
    thalassemia?: {
      status: string;
      method?: string;
      hba2Fraction?: string;
    };
    karyotype?: {
      result: string;
      bands?: string;
      resolution?: string;
    };
    sma?: string;
    cysticFibrosis?: string;
    g6pd?: string;
  };
  familyPedigree: {
    maternalGrandparents: string;
    paternalGrandparents: string;
    parents: string;
    siblings: string;
  };
  statutoryCompliance: {
    artActRegistered: boolean;
    rule13InsuranceActive: boolean;
    lifetimeDonationLimitCompliant: boolean;
    registryToken: string;
  };
  createdAt: string;
}

export const EYE_COLORS = ["Dark Brown", "Brown", "Black", "Hazel", "Amber", "Green", "Blue", "Grey"];
export const HAIR_COLORS = ["Black", "Dark Brown", "Brown", "Blonde", "Auburn", "Salt & Pepper"];
export const HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily"];
export const SKIN_TONES = ["Fair", "Wheatish", "Medium", "Olive", "Dusky", "Deep / Dark"];
export const BODY_BUILDS = ["Slender / Lean", "Athletic", "Medium / Average", "Heavy / Broad"];
export const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
export const EDUCATION_LEVELS = [
  { value: "Doctorate", label: "Doctorate (Ph.D)" },
  { value: "Master's Degree", label: "Master's Degree (M.Tech, M.Sc, MBA)" },
  { value: "Bachelor's Degree", label: "Bachelor's Degree (B.Tech, B.A, B.Sc)" },
  { value: "Professional Diploma", label: "Professional Diploma" },
  { value: "Higher Secondary", label: "Higher Secondary (10+2)" },
];

export const HEIGHT_OPTIONS_MALE = [
  { value: "all", label: "All Heights" },
  { value: "<168", label: "< 168 cm (Under 5'6\")" },
  { value: "168-173", label: "168 - 173 cm (5'6\" - 5'8\")" },
  { value: "173-178", label: "173 - 178 cm (5'8\" - 5'10\")" },
  { value: "178-183", label: "178 - 183 cm (5'10\" - 6'0\")" },
  { value: ">183", label: "> 183 cm (Above 6'0\")" },
];

export const AGE_OPTIONS_SPERM = [
  { value: "all", label: "All Ages" },
  { value: "21-25", label: "21 - 25 Years" },
  { value: "26-30", label: "26 - 30 Years" },
  { value: "31-40", label: "31 - 40 Years" },
  { value: "41-55", label: "41 - 55 Years" },
];

export const THALASSEMIA_OPTIONS = [
  "Negative (Normal HbA2 <3.5%)",
  "Negative / Non-Carrier (Verified HPLC)",
  "Carrier / Trait",
  "Screened / Normal",
];

export const KARYOTYPE_MALE_OPTIONS = [
  "46,XY (Normal Male)",
  "46,XY (High-Resolution G-Banding 550 Bands)",
  "Normal Male Karyotype",
];

const EMPTY_SPERM_FORM_DATA = {
  gameteType: "sperm" as const,
  donorCode: "",
  availability: "available" as "available" | "quarantine" | "allocated",
  availabilityLabel: "Available Immediately (Cryopreserved)",
  age: "" as string | number,
  bloodType: "",
  rhFactor: "Positive" as "Positive" | "Negative",
  heightCm: "" as string | number,
  weightKg: "" as string | number,
  eyeColor: "",
  hairColor: "",
  hairTexture: "",
  skinTone: "",
  bodyBuild: "",
  ethnicity: "",
  ancestryRegion: "",
  state: "",
  city: "",
  religion: "",
  motherTongue: "",
  languagesStr: "",
  educationLevel: "",
  degree: "",
  profession: "",
  provenFertility: "Proven sperm motility / Father of healthy child",
  livingChildren: 0 as string | number,
  abortion: 0 as string | number,
  talentsStr: "",
  hobbiesStr: "",
  donorStatement: "",
  hiv: "Non-Reactive",
  hbsAg: "Non-Reactive",
  hcv: "Non-Reactive",
  vdrl: "Non-Reactive",
  thalassemiaStatus: "Negative (Normal HbA2 <3.5%)",
  karyotypeResult: "46,XY (Normal Male)",
  maternalGrandparents: "",
  paternalGrandparents: "",
  parents: "",
  siblings: "",
  artActRegistered: true,
  rule13InsuranceActive: true,
  lifetimeDonationLimitCompliant: true,
  registryToken: "",
};

export default function AdminSpermDonorsPage() {
  const [donors, setDonors] = useState<ArtDonorItem[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, quarantine: 0, allocated: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [skinFilter, setSkinFilter] = useState("all");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [heightFilter, setHeightFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Right-side Filter Drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Form State
  const [activeDonor, setActiveDonor] = useState<ArtDonorItem | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_SPERM_FORM_DATA });
  const [submitting, setSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<"basic" | "phenotype" | "education" | "viral" | "pedigree" | "compliance">("basic");
  const [dossierTab, setDossierTab] = useState<"basic" | "viral" | "pedigree" | "compliance">("basic");

  // Count active filters
  const activeFilterCount = [
    stateFilter !== "all",
    cityFilter !== "all",
    skinFilter !== "all",
    bloodFilter !== "all",
    heightFilter !== "all",
    ageFilter !== "all",
    educationFilter !== "all",
    availabilityFilter !== "all",
    Boolean(search.trim()),
  ].filter(Boolean).length;

  // Fetch Sperm Donors from dedicated API
  const fetchSpermDonors = async () => {
    setLoading(true);
    try {
      let url = `/api/art-donors/sperm?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (stateFilter !== "all") url += `state=${encodeURIComponent(stateFilter)}&`;
      if (cityFilter !== "all") url += `city=${encodeURIComponent(cityFilter)}&`;
      if (skinFilter !== "all") url += `skinTone=${encodeURIComponent(skinFilter)}&`;
      if (bloodFilter !== "all") url += `bloodType=${encodeURIComponent(bloodFilter)}&`;
      if (heightFilter !== "all") url += `heightRange=${encodeURIComponent(heightFilter)}&`;
      if (ageFilter !== "all") url += `ageRange=${encodeURIComponent(ageFilter)}&`;
      if (educationFilter !== "all") url += `educationLevel=${encodeURIComponent(educationFilter)}&`;
      if (availabilityFilter !== "all") url += `availability=${encodeURIComponent(availabilityFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load sperm donors");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network error while loading sperm donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpermDonors();
  }, [stateFilter, cityFilter, skinFilter, bloodFilter, heightFilter, ageFilter, educationFilter, availabilityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSpermDonors();
  };

  const handleStateFilterChange = (newState: string) => {
    setStateFilter(newState);
    if (newState !== "all") {
      const cities = getCitiesForState(newState);
      if (!cities.includes(cityFilter)) {
        setCityFilter("all");
      }
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStateFilter("all");
    setCityFilter("all");
    setSkinFilter("all");
    setBloodFilter("all");
    setHeightFilter("all");
    setAgeFilter("all");
    setEducationFilter("all");
    setAvailabilityFilter("all");
  };

  const hasActiveFilters = activeFilterCount > 0;

  // Open Add Sperm Modal
  const handleOpenAdd = () => {
    setFormData({
      ...EMPTY_SPERM_FORM_DATA,
    });
    setFormTab("basic");
    setIsAddOpen(true);
  };

  // Open Edit Sperm Modal
  const handleOpenEdit = (donor: ArtDonorItem) => {
    setActiveDonor(donor);
    setFormData({
      gameteType: "sperm",
      donorCode: donor.donorCode || "",
      availability: donor.availability || "available",
      availabilityLabel: donor.availabilityLabel || "Available Immediately (Cryopreserved)",
      age: donor.age ?? "",
      bloodType: donor.bloodType || "",
      rhFactor: donor.rhFactor || "Positive",
      heightCm: donor.heightCm ?? "",
      weightKg: donor.weightKg ?? "",
      eyeColor: donor.eyeColor || "",
      hairColor: donor.hairColor || "",
      hairTexture: donor.hairTexture || "",
      skinTone: donor.skinTone || "",
      bodyBuild: donor.bodyBuild || "",
      ethnicity: donor.ethnicity || "",
      ancestryRegion: donor.ancestryRegion || "",
      state: donor.state || "",
      city: donor.city || "",
      religion: donor.religion || "",
      motherTongue: donor.motherTongue || "",
      languagesStr: (donor.languages || []).join(", "),
      educationLevel: donor.educationLevel || "",
      degree: donor.degree || "",
      profession: donor.profession || "",
      provenFertility: donor.provenFertility || "Proven sperm motility / Father of healthy child",
      livingChildren: donor.livingChildren ?? 0,
      abortion: 0,
      talentsStr: (donor.talents || []).join(", "),
      hobbiesStr: (donor.hobbies || []).join(", "),
      donorStatement: donor.donorStatement || "",
      hiv: donor.viralMarkers?.hiv || "Non-Reactive",
      hbsAg: donor.viralMarkers?.hbsAg || "Non-Reactive",
      hcv: donor.viralMarkers?.hcv || "Non-Reactive",
      vdrl: donor.viralMarkers?.vdrl || "Non-Reactive",
      thalassemiaStatus: donor.geneticScreenings?.thalassemia?.status || "Negative (Normal HbA2 <3.5%)",
      karyotypeResult: donor.geneticScreenings?.karyotype?.result || "46,XY (Normal Male)",
      maternalGrandparents: donor.familyPedigree?.maternalGrandparents || "",
      paternalGrandparents: donor.familyPedigree?.paternalGrandparents || "",
      parents: donor.familyPedigree?.parents || "",
      siblings: donor.familyPedigree?.siblings || "",
      artActRegistered: donor.statutoryCompliance?.artActRegistered ?? true,
      rule13InsuranceActive: donor.statutoryCompliance?.rule13InsuranceActive ?? true,
      lifetimeDonationLimitCompliant: donor.statutoryCompliance?.lifetimeDonationLimitCompliant ?? true,
      registryToken: donor.statutoryCompliance?.registryToken || "",
    });
    setFormTab("basic");
    setIsEditOpen(true);
  };

  const handleOpenDelete = (donor: ArtDonorItem) => {
    setActiveDonor(donor);
    setIsDeleteOpen(true);
  };

  const handleOpenDossier = (donor: ArtDonorItem) => {
    setActiveDonor(donor);
    setDossierTab("basic");
    setIsDossierOpen(true);
  };

  // Submit Create Sperm Donor
  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bloodType) {
      toast.error("Please select a blood group");
      setFormTab("basic");
      return;
    }
    if (!formData.age || Number(formData.age) < 21 || Number(formData.age) > 55) {
      toast.error("Under ART Act 2021, semen donors must be between 21 and 55 years old");
      setFormTab("basic");
      return;
    }
    if (!formData.heightCm || Number(formData.heightCm) <= 0) {
      toast.error("Please enter height in cm");
      setFormTab("basic");
      return;
    }
    if (!formData.weightKg || Number(formData.weightKg) <= 0) {
      toast.error("Please enter weight in kg");
      setFormTab("basic");
      return;
    }
    if (!formData.skinTone) {
      toast.error("Please select skin complexion in Phenotype tab");
      setFormTab("phenotype");
      return;
    }
    if (!formData.ethnicity.trim()) {
      toast.error("Please enter ethnicity in Phenotype tab");
      setFormTab("phenotype");
      return;
    }
    if (!formData.degree.trim() || !formData.profession.trim()) {
      toast.error("Please enter degree and profession in Career tab");
      setFormTab("education");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        donorCode: formData.donorCode.trim() || undefined,
        gameteType: "sperm",
        availability: formData.availability,
        availabilityLabel: formData.availabilityLabel.trim() || undefined,
        age: Number(formData.age),
        bloodType: formData.bloodType,
        rhFactor: formData.rhFactor,
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        eyeColor: formData.eyeColor.trim() || "Dark Brown",
        hairColor: formData.hairColor.trim() || "Black",
        hairTexture: formData.hairTexture.trim() || "Straight",
        skinTone: formData.skinTone.trim() || "Wheatish",
        bodyBuild: formData.bodyBuild.trim() || "Athletic",
        ethnicity: formData.ethnicity.trim(),
        ancestryRegion: formData.ancestryRegion.trim() || "North Indian",
        state: formData.state?.trim() || "",
        city: formData.city?.trim() || "",
        religion: formData.religion.trim() || "Hindu",
        motherTongue: formData.motherTongue.trim() || "Hindi",
        languages: formData.languagesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        educationLevel: formData.educationLevel || "Bachelor's Degree",
        degree: formData.degree.trim(),
        profession: formData.profession.trim(),
        provenFertility: formData.provenFertility.trim() || "Proven sperm motility / Father of healthy child",
        livingChildren: Number(formData.livingChildren) || 0,
        talents: formData.talentsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hobbies: formData.hobbiesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        donorStatement: formData.donorStatement.trim(),
        viralMarkers: {
          hiv: formData.hiv,
          hbsAg: formData.hbsAg,
          hcv: formData.hcv,
          vdrl: formData.vdrl,
        },
        familyPedigree: {
          maternalGrandparents: formData.maternalGrandparents.trim(),
          paternalGrandparents: formData.paternalGrandparents.trim(),
          parents: formData.parents.trim(),
          siblings: formData.siblings.trim(),
        },
        statutoryCompliance: {
          artActRegistered: formData.artActRegistered,
          rule13InsuranceActive: formData.rule13InsuranceActive,
          lifetimeDonationLimitCompliant: formData.lifetimeDonationLimitCompliant,
          registryToken: formData.registryToken.trim() || undefined,
        },
      };

      const res = await fetch("/api/art-donors/sperm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Sperm Donor profile registered successfully!");
        setIsAddOpen(false);
        fetchSpermDonors();
      } else {
        toast.error(data.error || "Failed to create sperm donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating sperm donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update Sperm Donor
  const handleUpdateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonor) return;

    setSubmitting(true);
    try {
      const payload = {
        donorCode: formData.donorCode.trim(),
        gameteType: "sperm",
        availability: formData.availability,
        availabilityLabel: formData.availabilityLabel.trim(),
        age: Number(formData.age),
        bloodType: formData.bloodType,
        rhFactor: formData.rhFactor,
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        eyeColor: formData.eyeColor.trim(),
        hairColor: formData.hairColor.trim(),
        hairTexture: formData.hairTexture.trim(),
        skinTone: formData.skinTone.trim(),
        bodyBuild: formData.bodyBuild.trim(),
        ethnicity: formData.ethnicity.trim(),
        ancestryRegion: formData.ancestryRegion.trim(),
        state: formData.state?.trim() || "",
        city: formData.city?.trim() || "",
        religion: formData.religion.trim(),
        motherTongue: formData.motherTongue.trim(),
        languages: formData.languagesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        educationLevel: formData.educationLevel,
        degree: formData.degree.trim(),
        profession: formData.profession.trim(),
        provenFertility: formData.provenFertility.trim(),
        livingChildren: Number(formData.livingChildren) || 0,
        talents: formData.talentsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hobbies: formData.hobbiesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        donorStatement: formData.donorStatement.trim(),
        viralMarkers: {
          hiv: formData.hiv,
          hbsAg: formData.hbsAg,
          hcv: formData.hcv,
          vdrl: formData.vdrl,
        },
        familyPedigree: {
          maternalGrandparents: formData.maternalGrandparents.trim(),
          paternalGrandparents: formData.paternalGrandparents.trim(),
          parents: formData.parents.trim(),
          siblings: formData.siblings.trim(),
        },
        statutoryCompliance: {
          artActRegistered: formData.artActRegistered,
          rule13InsuranceActive: formData.rule13InsuranceActive,
          lifetimeDonationLimitCompliant: formData.lifetimeDonationLimitCompliant,
          registryToken: formData.registryToken.trim(),
        },
      };

      const res = await fetch(`/api/art-donors/sperm/${activeDonor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Sperm donor profile updated successfully!");
        setIsEditOpen(false);
        fetchSpermDonors();
      } else {
        toast.error(data.error || "Failed to update sperm donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error updating sperm donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Sperm Donor
  const handleDeleteDonor = async () => {
    if (!activeDonor) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/art-donors/sperm/${activeDonor._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sperm donor profile deleted successfully");
        setIsDeleteOpen(false);
        fetchSpermDonors();
      } else {
        toast.error(data.error || "Failed to delete sperm donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error deleting sperm donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 pb-16 px-1 sm:px-2">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-border/50 pb-6 pt-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-[#285b63] dark:text-teal-400 text-xs font-semibold">
            <Dna className="h-4 w-4" />
            ART Act 2021 Clinical Semen Bank
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sperm Donors Directory (Semen)
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Register and manage verified male cryopreserved semen donors stored in the dedicated Sperm Donor database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={fetchSpermDonors}
            disabled={loading}
            className="rounded-xl h-11 px-3.5 text-xs font-medium gap-2 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* DEDICATED BUTTON: ADD SPERM DONOR */}
          <Button
            onClick={handleOpenAdd}
            className="rounded-xl h-11 px-5 bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63] hover:from-[#13262c] hover:to-[#1d444a] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg gap-2 transition-all"
          >
            <Dna className="h-4 w-4 text-teal-300" />
            + Add Sperm Donor
          </Button>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#285b63] dark:text-teal-400 uppercase tracking-wider">Total Sperm Donors</span>
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#285b63] dark:text-teal-400">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold mt-3 text-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">Verified semen profiles in DB</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available / Ready</span>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">{stats.available}</div>
          <p className="text-xs text-muted-foreground mt-1">Cryopreserved vials for IUI/ICSI</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Cryo Quarantine</span>
            <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">{stats.quarantine}</div>
          <p className="text-xs text-muted-foreground mt-1">Mandatory 6-month quarantine</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Allocated / Sold</span>
            <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-3">{stats.allocated}</div>
          <p className="text-xs text-muted-foreground mt-1">Allocated to clinical ART cycle</p>
        </Card>
      </div>

      {/* ================= SEARCH & ACTIONS BAR ================= */}
      <Card className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80 md:w-96">
            <Input
              placeholder="Search code, state, city, profession, heritage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-11 text-xs rounded-xl bg-background"
            />
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => fetchSpermDonors()}
              disabled={loading}
              className="h-11 px-3.5 rounded-xl text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* BUTTON TO OPEN RIGHT-SIDE FILTER SIDEBAR */}
            <Button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`h-11 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs transition-all ${
                activeFilterCount > 0
                  ? "bg-[#285b63] hover:bg-[#1f474d] text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground border"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#285b63]">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleResetFilters}
                className="h-11 px-3 rounded-xl text-xs text-muted-foreground hover:text-rose-600 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* ACTIVE FILTER PILLS */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
              Active:
            </span>
            {stateFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-[#285b63] dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 font-medium">
                <MapPin className="h-3 w-3" /> State: {stateFilter}
                <button type="button" onClick={() => { setStateFilter("all"); setCityFilter("all"); }} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {cityFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-[#285b63] dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 font-medium">
                <MapPin className="h-3 w-3" /> City: {cityFilter}
                <button type="button" onClick={() => setCityFilter("all")} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {skinFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-medium">
                Skin: {skinFilter}
                <button type="button" onClick={() => setSkinFilter("all")} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
              </span>
            )}
            {bloodFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-medium">
                Blood: {bloodFilter}
                <button type="button" onClick={() => setBloodFilter("all")} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
              </span>
            )}
            {heightFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-medium">
                Height: {HEIGHT_OPTIONS_MALE.find(h => h.value === heightFilter)?.label || heightFilter}
                <button type="button" onClick={() => setHeightFilter("all")} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
              </span>
            )}
            {ageFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-medium">
                Age: {AGE_OPTIONS_SPERM.find(a => a.value === ageFilter)?.label || ageFilter}
                <button type="button" onClick={() => setAgeFilter("all")} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
              </span>
            )}
            {availabilityFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border font-medium">
                Status: {availabilityFilter}
                <button type="button" onClick={() => setAvailabilityFilter("all")} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-rose-600 hover:underline font-semibold ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* ================= DATA TABLE ================= */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5">Donor Profile</th>
                <th className="py-4 px-4">Gamete Type</th>
                <th className="py-4 px-4">Blood Group</th>
                <th className="py-4 px-4">Age / Height</th>
                <th className="py-4 px-4">Phenotype Traits</th>
                <th className="py-4 px-4">Profession &amp; Degree</th>
                <th className="py-4 px-4">Viral Markers</th>
                <th className="py-4 px-4">ART Compliance</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-[#285b63]" />
                    <span className="text-sm font-medium">Loading Sperm Donor database...</span>
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-sm font-semibold text-foreground">No sperm donors match your filters.</p>
                      <p className="text-xs text-muted-foreground">Click &quot;+ Add Sperm Donor&quot; to register a new semen profile.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr key={donor._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5">
                      <div>
                        <span className="font-mono font-bold text-foreground text-xs block">
                          {donor.donorCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          {donor.city || donor.state ? (
                            <>
                              <MapPin className="h-3 w-3 text-[#285b63] shrink-0" />
                              <span>{donor.city ? `${donor.city}, ${donor.state}` : donor.state}</span>
                            </>
                          ) : (
                            <span>{donor.ethnicity} • {donor.ancestryRegion}</span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-[#285b63] dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60">
                        <Dna className="h-3 w-3 text-[#285b63]" />
                        Sperm (Semen)
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border text-xs">
                        {donor.bloodType} {donor.rhFactor === "Positive" ? "(+)" : "(-)"}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">{donor.age} yrs</div>
                      <div className="text-[11px] text-muted-foreground">{donor.heightFormatted}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-foreground font-medium">
                        {donor.skinTone} Complexion
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {donor.hairColor} • {donor.eyeColor} Eyes
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground max-w-[160px] truncate" title={donor.profession}>
                        {donor.profession}
                      </div>
                      <div className="text-[11px] text-muted-foreground max-w-[160px] truncate" title={donor.degree}>
                        {donor.degree}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/50">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Non-Reactive
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono text-[11px] text-foreground font-semibold">
                        {donor.statutoryCompliance?.registryToken || "ART Registered"}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Rule 13 Insured</div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                          donor.availability === "available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : donor.availability === "quarantine"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {donor.availability === "available"
                          ? "Available"
                          : donor.availability === "quarantine"
                          ? "Quarantined"
                          : "Allocated"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border">
                            <DropdownMenuItem
                              onClick={() => handleOpenDossier(donor)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                            >
                              <Eye className="w-4 h-4 text-teal-600" /> View Clinical Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(donor)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                            >
                              <Edit className="w-4 h-4 text-emerald-600" /> Edit Donor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(donor)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" /> Delete Donor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= ADD SPERM DONOR DIALOG ================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-6 sm:p-7 bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63] text-white shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
                <Dna className="h-6 w-6 text-teal-300" />
                Register New Sperm Donor (Semen)
              </DialogTitle>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-teal-950/50 text-teal-200 border border-teal-300/30">
                Sperm Donor DB
              </span>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-gray-200 mt-1">
              Registered male semen donors comply with mandatory cryopreservation protocols and ART Act 2021 regulations.
            </DialogDescription>

            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/15 overflow-x-auto scrollbar-hide">
              {[
                { id: "basic", label: "1. Basic & Gamete", icon: User },
                { id: "phenotype", label: "2. Phenotype & Traits", icon: Activity },
                { id: "education", label: "3. Career & Cryo", icon: Award },
                { id: "viral", label: "4. Viral Markers & Genetics", icon: Activity },
                { id: "pedigree", label: "5. Pedigree", icon: Heart },
                { id: "compliance", label: "6. Compliance", icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      formTab === tab.id ? "bg-white text-gray-900 shadow-md" : "text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateDonor} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
              {/* TAB 1 */}
              {formTab === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Gamete Category
                      </label>
                      <input
                        disabled
                        value="Sperm Donor (Semen / Male)"
                        className="w-full h-11 px-3.5 rounded-xl border bg-muted/40 font-semibold text-foreground cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Donor Code (Auto if blank)
                      </label>
                      <Input
                        value={formData.donorCode}
                        onChange={(e) => setFormData({ ...formData, donorCode: e.target.value })}
                        placeholder="e.g. MED-SD-1093"
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="available">Available Immediately</option>
                        <option value="quarantine">Cryo Quarantine Phase</option>
                        <option value="allocated">Allocated / Sold</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Age (21-55 Yrs) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min={21}
                        max={55}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g. 28"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Blood Group <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Blood Group...</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Rh Factor
                      </label>
                      <select
                        value={formData.rhFactor}
                        onChange={(e) => setFormData({ ...formData, rhFactor: e.target.value as any })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="Positive">Positive (+)</option>
                        <option value="Negative">Negative (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Height (cm) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.heightCm}
                        onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                        placeholder="e.g. 178"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Weight (kg) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.weightKg}
                        onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                        placeholder="e.g. 72"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Badge
                      </label>
                      <Input
                        value={formData.availabilityLabel}
                        onChange={(e) => setFormData({ ...formData, availabilityLabel: e.target.value })}
                        placeholder="e.g. Available Immediately (Cryopreserved)"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHENOTYPE */}
              {formTab === "phenotype" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Skin Complexion <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.skinTone}
                        onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Complexion...</option>
                        {SKIN_TONES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Eye Color <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.eyeColor}
                        onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Eye Color...</option>
                        {EYE_COLORS.map((ec) => (
                          <option key={ec} value={ec}>{ec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hair Color <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.hairColor}
                        onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Hair Color...</option>
                        {HAIR_COLORS.map((hc) => (
                          <option key={hc} value={hc}>{hc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hair Texture
                      </label>
                      <select
                        value={formData.hairTexture}
                        onChange={(e) => setFormData({ ...formData, hairTexture: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Hair Texture...</option>
                        {HAIR_TEXTURES.map((ht) => (
                          <option key={ht} value={ht}>{ht}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Body Build
                      </label>
                      <select
                        value={formData.bodyBuild}
                        onChange={(e) => setFormData({ ...formData, bodyBuild: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Body Build...</option>
                        {BODY_BUILDS.map((bb) => (
                          <option key={bb} value={bb}>{bb}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Ethnicity <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.ethnicity}
                        onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                        placeholder="e.g. North Indian, Punjabi, Gujarati"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Ancestry Region
                      </label>
                      <Input
                        value={formData.ancestryRegion}
                        onChange={(e) => setFormData({ ...formData, ancestryRegion: e.target.value })}
                        placeholder="e.g. Delhi / Haryana"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <select
                        value={formData.state || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, state: val, city: "" });
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer text-xs"
                      >
                        <option value="">Select State...</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        City
                      </label>
                      <select
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer text-xs"
                      >
                        <option value="">Select City...</option>
                        {getCitiesForState(formData.state || "").map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Religion
                      </label>
                      <Input
                        value={formData.religion}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                        placeholder="e.g. Hindu, Sikh"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Mother Tongue
                      </label>
                      <Input
                        value={formData.motherTongue}
                        onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
                        placeholder="e.g. Hindi, Punjabi"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Languages (comma-separated)
                      </label>
                      <Input
                        value={formData.languagesStr}
                        onChange={(e) => setFormData({ ...formData, languagesStr: e.target.value })}
                        placeholder="e.g. Hindi, English"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAREER & CRYO */}
              {formTab === "education" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Education Level
                      </label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        <option value="">Select Education Level...</option>
                        {EDUCATION_LEVELS.map((ed) => (
                          <option key={ed.value} value={ed.value}>{ed.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Degree / Qualification <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        placeholder="e.g. B.Tech Computer Science"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Current Profession <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="e.g. Tech Lead &amp; Cloud Architect"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Sperm-Specific Cryo & Semen Parameters */}
                  <div className="p-4 rounded-2xl border bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Semen Analysis &amp; Cryo Quality Records
                      </h4>
                      <span className="text-[11px] text-teal-700 font-semibold">
                        WHO 6th Edition Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Proven Fertility / Motility Notes
                        </label>
                        <Input
                          value={formData.provenFertility}
                          onChange={(e) => setFormData({ ...formData, provenFertility: e.target.value })}
                          placeholder="e.g. Post-thaw motility 55%, count > 45M/ml"
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Living Children (if any)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.livingChildren}
                          onChange={(e) => setFormData({ ...formData, livingChildren: e.target.value })}
                          placeholder="0"
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-teal-700 bg-teal-50 p-3 rounded-xl border border-teal-200/60 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#285b63]" />
                      <span>Cryopreservation requires 6-month serological quarantine re-test under ICMR and ART Act 2021 guidelines.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Talents &amp; Skills
                      </label>
                      <Input
                        value={formData.talentsStr}
                        onChange={(e) => setFormData({ ...formData, talentsStr: e.target.value })}
                        placeholder="e.g. Guitar, Football, Chess"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hobbies &amp; Interests
                      </label>
                      <Input
                        value={formData.hobbiesStr}
                        onChange={(e) => setFormData({ ...formData, hobbiesStr: e.target.value })}
                        placeholder="e.g. Cycling, Coding, Astronomy"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Altruistic Motivation &amp; Donor Statement
                    </label>
                    <textarea
                      rows={3}
                      value={formData.donorStatement}
                      onChange={(e) => setFormData({ ...formData, donorStatement: e.target.value })}
                      placeholder="Enter donor's personal altruistic motivation..."
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: VIRAL MARKERS & GENETICS */}
              {formTab === "viral" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        HIV 1 &amp; 2
                      </label>
                      <select
                        value={formData.hiv}
                        onChange={(e) => setFormData({ ...formData, hiv: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        HBsAg (Hep B)
                      </label>
                      <select
                        value={formData.hbsAg}
                        onChange={(e) => setFormData({ ...formData, hbsAg: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        HCV (Hep C)
                      </label>
                      <select
                        value={formData.hcv}
                        onChange={(e) => setFormData({ ...formData, hcv: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Syphilis (VDRL)
                      </label>
                      <select
                        value={formData.vdrl}
                        onChange={(e) => setFormData({ ...formData, vdrl: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Thalassemia Screening (HPLC)
                      </label>
                      <select
                        value={formData.thalassemiaStatus}
                        onChange={(e) => setFormData({ ...formData, thalassemiaStatus: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        {THALASSEMIA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Cytogenetic Karyotype
                      </label>
                      <select
                        value={formData.karyotypeResult}
                        onChange={(e) => setFormData({ ...formData, karyotypeResult: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer"
                      >
                        {KARYOTYPE_MALE_OPTIONS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PEDIGREE */}
              {formTab === "pedigree" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Maternal Grandparents Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.maternalGrandparents}
                        onChange={(e) => setFormData({ ...formData, maternalGrandparents: e.target.value })}
                        placeholder="Healthy longevity, no hereditary disorders..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Paternal Grandparents Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.paternalGrandparents}
                        onChange={(e) => setFormData({ ...formData, paternalGrandparents: e.target.value })}
                        placeholder="Active longevity, good cardiovascular health..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Parents History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.parents}
                        onChange={(e) => setFormData({ ...formData, parents: e.target.value })}
                        placeholder="Both parents healthy and active..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Siblings History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.siblings}
                        onChange={(e) => setFormData({ ...formData, siblings: e.target.value })}
                        placeholder="All siblings in excellent health..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: COMPLIANCE */}
              {formTab === "compliance" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        National Registry Compliance Token
                      </label>
                      <Input
                        value={formData.registryToken}
                        onChange={(e) => setFormData({ ...formData, registryToken: e.target.value })}
                        placeholder="e.g. REG-2026-IND-DEL-00412"
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20">
                        <input
                          type="checkbox"
                          checked={formData.artActRegistered}
                          onChange={(e) => setFormData({ ...formData, artActRegistered: e.target.checked })}
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">ART Act 2021 Registered</div>
                          <div className="text-[11px] text-muted-foreground">Logged with National ART Registry</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20">
                        <input
                          type="checkbox"
                          checked={formData.rule13InsuranceActive}
                          onChange={(e) => setFormData({ ...formData, rule13InsuranceActive: e.target.checked })}
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Rule 13 Medical Insurance Active</div>
                          <div className="text-[11px] text-muted-foreground">Mandatory 12-month clinical underwriting</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20">
                        <input
                          type="checkbox"
                          checked={formData.lifetimeDonationLimitCompliant}
                          onChange={(e) => setFormData({ ...formData, lifetimeDonationLimitCompliant: e.target.checked })}
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Lifetime Donation Limit Compliant</div>
                          <div className="text-[11px] text-muted-foreground">Single cycle compliant under Section 27(2)</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex items-center justify-between shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 px-5 text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl h-11 px-7 bg-[#285b63] hover:bg-[#1d444a] text-white text-xs font-bold shadow-md">
                {submitting ? "Saving to Sperm DB..." : "Create Sperm Donor Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT SPERM DONOR DIALOG ================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-6 sm:p-7 bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63] text-white shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
                <Edit className="h-6 w-6 text-[#95e0b9]" />
                Edit Sperm Donor ({activeDonor?.donorCode})
              </DialogTitle>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-white/20 text-white">
                Sperm Donor
              </span>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-gray-200 mt-1">
              Modify clinical, phenotypic, or compliance parameters in the Sperm Donor database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDonor} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Donor Code</label>
                  <Input value={formData.donorCode} onChange={(e) => setFormData({ ...formData, donorCode: e.target.value })} className="h-11 rounded-xl font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Availability Status</label>
                  <select value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer">
                    <option value="available">Available Immediately</option>
                    <option value="quarantine">Cryo Quarantine</option>
                    <option value="allocated">Allocated / Sold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Age</label>
                  <Input type="number" min={21} max={55} value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Blood Group</label>
                  <select value={formData.bloodType} onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer">
                    <option value="">Select Blood Group...</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Skin Complexion</label>
                  <select value={formData.skinTone} onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer">
                    <option value="">Select Complexion...</option>
                    {SKIN_TONES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Height (cm)</label>
                  <Input type="number" value={formData.heightCm} onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                  <Input type="number" value={formData.weightKg} onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Degree</label>
                  <Input value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Profession</label>
                  <Input value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Living Children</label>
                  <Input type="number" value={formData.livingChildren} onChange={(e) => setFormData({ ...formData, livingChildren: e.target.value })} className="h-11 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">State</label>
                  <select
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer text-xs"
                  >
                    <option value="">Select State...</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">City</label>
                  <select
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground cursor-pointer text-xs"
                  >
                    <option value="">Select City...</option>
                    {getCitiesForState(formData.state || "").map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex items-center justify-between shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl h-11 px-5 text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl h-11 px-7 bg-[#285b63] hover:bg-[#1d444a] text-white text-xs font-bold shadow-md">
                {submitting ? "Updating..." : "Update Sperm Donor Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Delete Sperm Donor Profile?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Permanently delete donor <strong className="text-foreground font-mono">{activeDonor?.donorCode}</strong> from the Sperm Donor database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-3 mt-5">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl h-11 text-xs font-semibold flex-1">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteDonor} disabled={submitting} className="rounded-xl h-11 text-xs font-bold flex-1 shadow-md">
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= VIEW DOSSIER DIALOG ================= */}
      {activeDonor && (
        <Dialog open={isDossierOpen} onOpenChange={setIsDossierOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
            <div className="bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63] text-white p-6 sm:p-7 shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xl">{activeDonor.donorCode}</span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white">
                      Semen Donor
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-200 mt-1.5 leading-relaxed">
                    {activeDonor.ethnicity} • {activeDonor.degree} • {activeDonor.heightFormatted} • Blood: <strong className="text-[#ff7468]">{activeDonor.bloodType}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
              <div>
                <h4 className="font-serif text-base font-bold text-[#285b63] mb-3">Physical Phenotype &amp; Traits</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-muted/30 p-3.5 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Blood Group</div>
                    <div className="text-sm font-bold text-teal-700 mt-1">{activeDonor.bloodType} ({activeDonor.rhFactor})</div>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Height &amp; BMI</div>
                    <div className="text-sm font-bold text-foreground mt-1">{activeDonor.heightFormatted} (BMI {activeDonor.bmi})</div>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Skin Complexion</div>
                    <div className="text-sm font-bold text-foreground mt-1">{activeDonor.skinTone}</div>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Eye &amp; Hair Color</div>
                    <div className="text-sm font-bold text-foreground mt-1">{activeDonor.eyeColor} / {activeDonor.hairColor}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-base font-bold text-[#285b63] mb-3">Education &amp; Occupation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-muted/30 p-4 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Degree</div>
                    <div className="text-sm font-bold text-foreground mt-1">{activeDonor.degree}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{activeDonor.educationLevel}</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Profession</div>
                    <div className="text-sm font-bold text-foreground mt-1">{activeDonor.profession}</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-5 rounded-2xl border">
                <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Reproductive History &amp; Proven Fertility</h5>
                <p className="text-foreground text-sm font-medium">{activeDonor.provenFertility}</p>
                <div className="mt-2 text-xs font-semibold text-[#285b63]">
                  Living Children: {activeDonor.livingChildren} (Verified as per ART Act 2021)
                </div>
              </div>
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex justify-end shrink-0">
              <Button type="button" onClick={() => setIsDossierOpen(false)} className="rounded-xl h-11 px-6 text-xs font-bold bg-[#285b63] hover:bg-[#1d444a] text-white shadow-sm">
                Close Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= RIGHT-SIDE FILTER SIDEBAR DRAWER ================= */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col gap-0 z-[100] h-full bg-background border-l shadow-2xl overflow-hidden"
        >
          {/* Drawer Top Header */}
          <div className="p-5 border-b flex items-center justify-between bg-muted/20 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#285b63]" />
                <SheetTitle className="font-bold text-base text-foreground">
                  Filter Sperm Donors
                </SheetTitle>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#285b63] text-white">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <SheetDescription className="text-xs text-muted-foreground mt-1">
                Select geographic, phenotype &amp; clinical criteria
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* 1. LOCATION (STATE & CITY) */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#285b63]">
                <MapPin className="h-3.5 w-3.5" />
                <span>Location (State &amp; City)</span>
              </div>

              {/* State Select */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  State
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => handleStateFilterChange(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All States across India</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* City Select */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  City {stateFilter !== "all" && `(${stateFilter})`}
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">
                    {stateFilter === "all" ? "All Major Cities" : `All Cities in ${stateFilter}`}
                  </option>
                  {getCitiesForState(stateFilter).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* 2. PHYSICAL ATTRIBUTES */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Phenotypic Traits</span>
              </div>

              {/* Skin Tone */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Skin Tone / Complexion
                </label>
                <select
                  value={skinFilter}
                  onChange={(e) => setSkinFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All Skin Tones</option>
                  {SKIN_TONES.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Height Range
                </label>
                <select
                  value={heightFilter}
                  onChange={(e) => setHeightFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  {HEIGHT_OPTIONS_MALE.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* 3. MEDICAL & BIOLOGY */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span>Medical &amp; Compatibility</span>
              </div>

              {/* Blood Group */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Blood Group
                </label>
                <select
                  value={bloodFilter}
                  onChange={(e) => setBloodFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All Blood Groups</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Donor Age Range
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  {AGE_OPTIONS_SPERM.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* 4. STATUS & EDUCATION */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Status &amp; Education</span>
              </div>

              {/* Availability */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Availability Status
                </label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available Immediately</option>
                  <option value="quarantine">Cryo Quarantine</option>
                  <option value="allocated">Allocated / Sold</option>
                </select>
              </div>

              {/* Education */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Education Level
                </label>
                <select
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All Education Levels</option>
                  {EDUCATION_LEVELS.map((ed) => (
                    <option key={ed.value} value={ed.value}>{ed.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Drawer Bottom Sticky Footer */}
          <div className="p-4 border-t bg-muted/20 flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="flex-1 h-11 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All
            </Button>
            <Button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="flex-1 h-11 rounded-xl text-xs font-bold bg-[#285b63] hover:bg-[#1d444a] text-white gap-1.5 cursor-pointer shadow-md"
            >
              Show {donors.length} Donors
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
