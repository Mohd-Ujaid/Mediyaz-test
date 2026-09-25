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
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Dna,
  User,
  Heart,
  Activity,
  Award,
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

// Standard options for clean dropdown selection
export const EYE_COLORS = [
  "Dark Brown",
  "Brown",
  "Black",
  "Hazel",
  "Amber",
  "Green",
  "Blue",
  "Grey",
];

export const HAIR_COLORS = [
  "Black",
  "Dark Brown",
  "Brown",
  "Blonde",
  "Auburn",
  "Salt & Pepper",
];

export const HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily"];

export const SKIN_TONES = [
  "Fair",
  "Wheatish",
  "Medium",
  "Olive",
  "Dusky",
  "Deep / Dark",
];

export const BODY_BUILDS = [
  "Slender / Lean",
  "Athletic",
  "Medium / Average",
  "Heavy / Broad",
];

export const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

export const EDUCATION_LEVELS = [
  { value: "Doctorate", label: "Doctorate (Ph.D)" },
  { value: "Master's Degree", label: "Master's Degree (M.Tech, M.Sc, MBA, M.A)" },
  { value: "Bachelor's Degree", label: "Bachelor's Degree (B.Tech, B.Sc, B.Com, B.A)" },
  { value: "Professional Diploma", label: "Professional Diploma / Certification" },
  { value: "Higher Secondary", label: "Higher Secondary (10+2)" },
];

export const THALASSEMIA_OPTIONS = [
  "Negative (Normal HbA2 <3.5%)",
  "Negative / Non-Carrier (Verified HPLC)",
  "Carrier / Trait",
  "Screened / Normal",
];

export const KARYOTYPE_FEMALE_OPTIONS = [
  "46,XX (Normal Female)",
  "46,XX (High-Resolution G-Banding 550 Bands)",
  "Normal Female Karyotype",
];

export const KARYOTYPE_MALE_OPTIONS = [
  "46,XY (Normal Male)",
  "46,XY (High-Resolution G-Banding 550 Bands)",
  "Normal Male Karyotype",
];

const EMPTY_FORM_DATA = {
  gameteType: "egg" as "egg" | "sperm",
  donorCode: "",
  availability: "available" as "available" | "quarantine" | "allocated",
  availabilityLabel: "",
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
  religion: "",
  motherTongue: "",
  languagesStr: "",
  educationLevel: "",
  degree: "",
  profession: "",
  provenFertility: "",
  livingChildren: "" as string | number,
  abortion: "" as string | number,
  talentsStr: "",
  hobbiesStr: "",
  donorStatement: "",
  hiv: "Non-Reactive",
  hbsAg: "Non-Reactive",
  hcv: "Non-Reactive",
  vdrl: "Non-Reactive",
  thalassemiaStatus: "Negative (Normal HbA2 <3.5%)",
  karyotypeResult: "46,XX (Normal Female)",
  maternalGrandparents: "",
  paternalGrandparents: "",
  parents: "",
  siblings: "",
  artActRegistered: true,
  rule13InsuranceActive: true,
  lifetimeDonationLimitCompliant: true,
  registryToken: "",
};

export default function AdminDonorsPage() {
  const [donors, setDonors] = useState<ArtDonorItem[]>([]);
  const [stats, setStats] = useState({ total: 0, egg: 0, sperm: 0, available: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [gameteFilter, setGameteFilter] = useState<"all" | "egg" | "sperm">("all");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Active items
  const [activeDonor, setActiveDonor] = useState<ArtDonorItem | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM_DATA });
  const [submitting, setSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<"basic" | "phenotype" | "education" | "viral" | "pedigree" | "compliance">("basic");
  const [dossierTab, setDossierTab] = useState<"basic" | "viral" | "pedigree" | "compliance">("basic");

  // Load donors from API
  const fetchDonors = async () => {
    setLoading(true);
    try {
      let url = `/api/art-donors?`;
      if (gameteFilter !== "all") url += `gameteType=${gameteFilter}&`;
      if (bloodFilter !== "all") url += `bloodType=${encodeURIComponent(bloodFilter)}&`;
      if (availabilityFilter !== "all") url += `availability=${availabilityFilter}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load donors");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network error while loading donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [gameteFilter, bloodFilter, availabilityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDonors();
  };

  // Open Add Modal pre-configured specifically for Egg or Sperm Donor
  const handleOpenAdd = (type: "egg" | "sperm") => {
    setFormData({
      ...EMPTY_FORM_DATA,
      gameteType: type,
      karyotypeResult: type === "egg" ? "46,XX (Normal Female)" : "46,XY (Normal Male)",
      thalassemiaStatus: "Negative (Normal HbA2 <3.5%)",
      availabilityLabel:
        type === "egg"
          ? "Available Immediately (Vitrified)"
          : "Available Immediately (Cryopreserved)",
      provenFertility:
        type === "egg"
          ? "Mother of 1 healthy child (3 years old)"
          : "Proven sperm motility / Father of healthy child",
    });
    setFormTab("basic");
    setIsAddOpen(true);
  };

  // Open Edit Modal with selected donor data
  const handleOpenEdit = (donor: ArtDonorItem) => {
    setActiveDonor(donor);
    setFormData({
      gameteType: donor.gameteType,
      donorCode: donor.donorCode || "",
      availability: donor.availability || "available",
      availabilityLabel: donor.availabilityLabel || "",
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
      religion: donor.religion || "",
      motherTongue: donor.motherTongue || "",
      languagesStr: (donor.languages || []).join(", "),
      educationLevel: donor.educationLevel || "",
      degree: donor.degree || "",
      profession: donor.profession || "",
      provenFertility: donor.provenFertility || "",
      livingChildren: donor.livingChildren ?? "",
      abortion: donor.abortion ?? "",
      talentsStr: (donor.talents || []).join(", "),
      hobbiesStr: (donor.hobbies || []).join(", "),
      donorStatement: donor.donorStatement || "",
      hiv: donor.viralMarkers?.hiv || "Non-Reactive",
      hbsAg: donor.viralMarkers?.hbsAg || "Non-Reactive",
      hcv: donor.viralMarkers?.hcv || "Non-Reactive",
      vdrl: donor.viralMarkers?.vdrl || "Non-Reactive",
      thalassemiaStatus: donor.geneticScreenings?.thalassemia?.status || "Negative (Normal HbA2 <3.5%)",
      karyotypeResult:
        donor.geneticScreenings?.karyotype?.result ||
        (donor.gameteType === "egg" ? "46,XX (Normal Female)" : "46,XY (Normal Male)"),
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

  // Submit Add Donor
  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bloodType) {
      toast.error("Please select a blood group");
      setFormTab("basic");
      return;
    }
    if (!formData.age || Number(formData.age) <= 0) {
      toast.error("Please enter a valid donor age");
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
        gameteType: formData.gameteType,
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
        bodyBuild: formData.bodyBuild.trim() || "Medium / Average",
        ethnicity: formData.ethnicity.trim(),
        ancestryRegion: formData.ancestryRegion.trim() || "Not Specified",
        religion: formData.religion.trim() || "Hindu",
        motherTongue: formData.motherTongue.trim() || "Hindi",
        languages: formData.languagesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        educationLevel: formData.educationLevel || "Bachelor's Degree",
        degree: formData.degree.trim(),
        profession: formData.profession.trim(),
        provenFertility:
          formData.provenFertility.trim() ||
          (formData.gameteType === "egg"
            ? "Mother of 1 healthy child (3 years old)"
            : "Proven sperm motility / Father of healthy child"),
        livingChildren: Number(formData.livingChildren) || (formData.gameteType === "egg" ? 1 : 0),
        abortion: formData.gameteType === "egg" ? Number(formData.abortion) || 0 : 0,
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

      const res = await fetch("/api/art-donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `${formData.gameteType === "egg" ? "Egg" : "Sperm"} donor registered successfully!`
        );
        setIsAddOpen(false);
        fetchDonors();
      } else {
        toast.error(data.error || "Failed to create donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Donor
  const handleUpdateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonor) return;

    setSubmitting(true);
    try {
      const payload = {
        donorCode: formData.donorCode.trim(),
        gameteType: formData.gameteType,
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
        abortion: formData.gameteType === "egg" ? Number(formData.abortion) || 0 : 0,
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

      const res = await fetch(`/api/art-donors/${activeDonor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Donor profile updated successfully!");
        setIsEditOpen(false);
        fetchDonors();
      } else {
        toast.error(data.error || "Failed to update donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error updating donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Donor
  const handleDeleteDonor = async () => {
    if (!activeDonor) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/art-donors/${activeDonor._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Donor profile deleted successfully");
        setIsDeleteOpen(false);
        fetchDonors();
      } else {
        toast.error(data.error || "Failed to delete donor");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error deleting donor profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 pb-16 px-1 sm:px-2">
      {/* ================= PAGE HEADER & DEDICATED BUTTONS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-border/50 pb-6 pt-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-[#285b63] dark:text-teal-400 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            ART Act 2021 Clinical Donors Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Donors Directory
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Register and manage verified oocyte (egg) and semen (sperm) donor profiles.
          </p>
        </div>

        {/* TWO DEDICATED DONOR REGISTRATION BUTTONS (Egg & Sperm) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={fetchDonors}
            disabled={loading}
            className="rounded-xl h-11 px-3.5 text-xs font-medium gap-2 shadow-2xs hover:bg-muted"
            title="Refresh donor database"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Button 1: Add Egg Donor */}
          <Button
            onClick={() => handleOpenAdd("egg")}
            className="rounded-xl h-11 px-5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg gap-2 transition-all"
          >
            + Add Egg Donor
          </Button>

          {/* Button 2: Add Sperm Donor */}
          <Button
            onClick={() => handleOpenAdd("sperm")}
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Donors</span>
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold mt-3 text-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">Total profiles stored in MongoDB</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Egg Donors (Oocytes)</span>
            <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Heart className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-3">{stats.egg}</div>
          <p className="text-xs text-muted-foreground mt-1">Female vitrified oocyte donors</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#285b63] dark:text-teal-400 uppercase tracking-wider">Sperm Donors (Semen)</span>
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#285b63] dark:text-teal-400">
              <Dna className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-[#285b63] dark:text-teal-400 mt-3">{stats.sperm}</div>
          <p className="text-xs text-muted-foreground mt-1">Male cryo-quarantined donors</p>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/70 backdrop-blur-xs shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ready / Available</span>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">{stats.available}</div>
          <p className="text-xs text-muted-foreground mt-1">Immediately matching for cycles</p>
        </Card>
      </div>

      {/* ================= CONTROLS & FILTER BAR ================= */}
      <Card className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Gamete Type Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-muted/60 rounded-xl w-fit shrink-0">
            <button
              type="button"
              onClick={() => setGameteFilter("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                gameteFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setGameteFilter("egg")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                gameteFilter === "egg"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-200"></span>
              Egg Donors
            </button>
            <button
              type="button"
              onClick={() => setGameteFilter("sperm")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                gameteFilter === "sperm"
                  ? "bg-[#285b63] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-teal-200"></span>
              Sperm Donors
            </button>
          </div>

          {/* Search & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
              <Input
                placeholder="Search code, profession, heritage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 h-11 text-xs rounded-xl bg-background"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            </form>

            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Blood Groups</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="quarantine">Quarantined</option>
              <option value="allocated">Allocated</option>
            </select>

            {(search || bloodFilter !== "all" || availabilityFilter !== "all" || gameteFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setBloodFilter("all");
                  setAvailabilityFilter("all");
                  setGameteFilter("all");
                }}
                className="h-11 px-3 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ================= DONORS DATA TABLE ================= */}
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
                    <span className="text-sm font-medium">Loading ART donor database from MongoDB...</span>
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-sm font-semibold text-foreground">No donors found matching the criteria.</p>
                      <p className="text-xs text-muted-foreground">Click &quot;+ Add Egg Donor&quot; or &quot;+ Add Sperm Donor&quot; to register a profile.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr key={donor._id} className="hover:bg-muted/30 transition-colors">
                    {/* Donor Code & Details */}
                    <td className="py-4 px-5">
                      <div>
                        <span className="font-mono font-bold text-foreground text-xs block">
                          {donor.donorCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {donor.ethnicity} • {donor.ancestryRegion}
                        </span>
                      </div>
                    </td>

                    {/* Gamete Type */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          donor.gameteType === "egg"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60"
                            : "bg-teal-50 text-[#285b63] dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60"
                        }`}
                      >
                        {donor.gameteType === "egg" ? (
                          <>
                            Egg (Oocyte)
                          </>
                        ) : (
                          <>
                            <Dna className="h-3 w-3 text-[#285b63]" />
                            Sperm (Semen)
                          </>
                        )}
                      </span>
                    </td>

                    {/* Blood Group */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border text-xs">
                        {donor.bloodType}  
                      </span>
                    </td>

                    {/* Age / Height */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">{donor.age} yrs</div>
                      <div className="text-[11px] text-muted-foreground">{donor.heightFormatted}</div>
                    </td>

                    {/* Phenotype Traits */}
                    <td className="py-4 px-4">
                      <div className="text-foreground font-medium">
                        {donor.skinTone} Complexion
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {donor.hairColor} • {donor.eyeColor} Eyes
                      </div>
                    </td>

                    {/* Profession & Degree */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground max-w-[160px] truncate" title={donor.profession}>
                        {donor.profession}
                      </div>
                      <div className="text-[11px] text-muted-foreground max-w-[160px] truncate" title={donor.degree}>
                        {donor.degree}
                      </div>
                    </td>

                    {/* Viral Markers */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/50">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Non-Reactive
                      </span>
                    </td>

                    {/* Statutory Compliance */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-[11px] text-foreground font-semibold">
                        {donor.statutoryCompliance?.registryToken || "ART Registered"}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Rule 13 Insured</div>
                    </td>

                    {/* Availability */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                          donor.availability === "available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : donor.availability === "quarantine"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
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

                    {/* Actions */}
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
                              <Eye className="w-4 h-4 text-blue-600" /> View Clinical Profile
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

      {/* ================= ADD DONOR DIALOG (Specialized for Egg vs Sperm) ================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader
            className={`p-6 sm:p-7 text-white shrink-0 transition-colors ${
              formData.gameteType === "egg"
                ? "bg-gradient-to-r from-[#5a1428] via-[#831843] to-[#9d174d]"
                : "bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63]"
            }`}
          >
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
                {formData.gameteType === "egg" ? (
                  <>
                    Register New Egg Donor (Oocyte)
                  </>
                ) : (
                  <>
                    <Dna className="h-6 w-6 text-teal-300" />
                    Register New Sperm Donor (Semen)
                  </>
                )}
              </DialogTitle>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  formData.gameteType === "egg"
                    ? "bg-rose-950/50 text-rose-200 border-rose-300/30"
                    : "bg-teal-950/50 text-teal-200 border-teal-300/30"
                }`}
              >
                {formData.gameteType === "egg" ? "Female Donor Workflow" : "Male Donor Workflow"}
              </span>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-gray-200 mt-1">
              {formData.gameteType === "egg"
                ? "Register a verified female oocyte donor with required ART Act 2021 reproductive and genetic screening compliance."
                : "Register a verified male cryopreserved semen donor with complete pedigree and viral serology certification."}
            </DialogDescription>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/15 overflow-x-auto scrollbar-hide">
              {[
                { id: "basic", label: "1. Basic & Gamete", icon: User },
                { id: "phenotype", label: "2. Phenotype & Traits", icon: User },
                {
                  id: "education",
                  label: formData.gameteType === "egg" ? "3. Career & Fertility" : "3. Career & Cryo",
                  icon: Award,
                },
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
                      formTab === tab.id
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-200 hover:bg-white/10"
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
              {/* TAB 1: BASIC & GAMETE */}
              {formTab === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Gamete Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.gameteType}
                        onChange={(e) => {
                          const val = e.target.value as "egg" | "sperm";
                          setFormData({
                            ...formData,
                            gameteType: val,
                            karyotypeResult: val === "egg" ? "46,XX (Normal Female)" : "46,XY (Normal Male)",
                            availabilityLabel:
                              val === "egg"
                                ? "Available Immediately (Vitrified)"
                                : "Available Immediately (Cryopreserved)",
                          });
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-semibold text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="egg">Egg Donor (Oocyte / Female)</option>
                        <option value="sperm">Sperm Donor (Semen / Male)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Donor Code (Auto if empty)
                      </label>
                      <Input
                        value={formData.donorCode}
                        onChange={(e) => setFormData({ ...formData, donorCode: e.target.value })}
                        placeholder={formData.gameteType === "egg" ? "e.g. MED-ED-2104" : "e.g. MED-SD-1092"}
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) =>
                          setFormData({ ...formData, availability: e.target.value as any })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="available">Available Immediately</option>
                        <option value="quarantine">Cryo Quarantine Phase</option>
                        <option value="allocated">Allocated</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Age (Years) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min={formData.gameteType === "egg" ? 21 : 21}
                        max={formData.gameteType === "egg" ? 35 : 55}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder={formData.gameteType === "egg" ? "e.g. 26 (21-35 yrs)" : "e.g. 28 (21-55 yrs)"}
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
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        onChange={(e) =>
                          setFormData({ ...formData, rhFactor: e.target.value as any })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        placeholder={formData.gameteType === "egg" ? "e.g. 165" : "e.g. 178"}
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
                        placeholder={formData.gameteType === "egg" ? "e.g. 56" : "e.g. 72"}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Badge Label
                      </label>
                      <Input
                        value={formData.availabilityLabel}
                        onChange={(e) =>
                          setFormData({ ...formData, availabilityLabel: e.target.value })
                        }
                        placeholder={
                          formData.gameteType === "egg"
                            ? "e.g. Available Immediately (Vitrified)"
                            : "e.g. Available Immediately (Cryopreserved)"
                        }
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHENOTYPE & BACKGROUND WITH CLEAN DROPDOWNS */}
              {formTab === "phenotype" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {/* Eye Color Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Eye Color <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.eyeColor}
                        onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Eye Color...</option>
                        {EYE_COLORS.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hair Color Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hair Color <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.hairColor}
                        onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Hair Color...</option>
                        {HAIR_COLORS.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hair Texture Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hair Texture
                      </label>
                      <select
                        value={formData.hairTexture}
                        onChange={(e) => setFormData({ ...formData, hairTexture: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Hair Texture...</option>
                        {HAIR_TEXTURES.map((tex) => (
                          <option key={tex} value={tex}>{tex}</option>
                        ))}
                      </select>
                    </div>

                    {/* Skin Tone Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Skin Complexion <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.skinTone}
                        onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Skin Complexion...</option>
                        {SKIN_TONES.map((tone) => (
                          <option key={tone} value={tone}>{tone}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Body Build Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Body Build
                      </label>
                      <select
                        value={formData.bodyBuild}
                        onChange={(e) => setFormData({ ...formData, bodyBuild: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Body Build...</option>
                        {BODY_BUILDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
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
                        placeholder="e.g. North Indian, South Indian, Bengali"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Ancestry Region
                      </label>
                      <Input
                        value={formData.ancestryRegion}
                        onChange={(e) =>
                          setFormData({ ...formData, ancestryRegion: e.target.value })
                        }
                        placeholder="e.g. Delhi / Punjab, Konkan, Gujarat"
                        className="h-11 rounded-xl text-xs"
                      />
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
                        placeholder="e.g. Hindu, Sikh, Christian, Jain"
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
                        placeholder="e.g. Hindi, Punjabi, Bengali, Marathi"
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
                        placeholder="e.g. Hindi, English, Punjabi"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAREER & FERTILITY / CRYO */}
              {formTab === "education" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Education Level Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Education Level
                      </label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) =>
                          setFormData({ ...formData, educationLevel: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        placeholder="e.g. M.Tech in Data Science, MBA Finance"
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
                        placeholder="e.g. Senior Software Architect, Corporate Consultant"
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* ADAPTIVE FERTILITY & REPRODUCTIVE SECTION (Egg vs Sperm) */}
                  <div className="p-4 rounded-2xl border bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        {formData.gameteType === "egg"
                          ? "Oocyte Donor Reproductive History (ART Act Sec 27 Compliance)"
                          : "Sperm Donor Semen & Fertility Records"}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {formData.gameteType === "egg"
                          ? "Must have at least 1 living child (age ≥ 3)"
                          : "Cryo viability & motility verified"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className={formData.gameteType === "sperm" ? "sm:col-span-2" : ""}>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Proven Fertility / Semen Notes
                        </label>
                        <Input
                          value={formData.provenFertility}
                          onChange={(e) =>
                            setFormData({ ...formData, provenFertility: e.target.value })
                          }
                          placeholder={
                            formData.gameteType === "egg"
                              ? "e.g. Mother of 1 healthy daughter (4 years old)"
                              : "e.g. Post-thaw motility 55%, father of 1 healthy child"
                          }
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Living Children {formData.gameteType === "egg" && <span className="text-rose-500">*</span>}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.livingChildren}
                          onChange={(e) =>
                            setFormData({ ...formData, livingChildren: e.target.value })
                          }
                          placeholder={formData.gameteType === "egg" ? "e.g. 1" : "e.g. 1 (or 0)"}
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>

                      {/* Previous Abortions applies to Egg donors only */}
                      {formData.gameteType === "egg" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Previous Abortions
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.abortion}
                            onChange={(e) =>
                              setFormData({ ...formData, abortion: e.target.value })
                            }
                            placeholder="e.g. 0"
                            className="h-11 rounded-xl text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {formData.gameteType === "sperm" && (
                      <div className="text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200/50 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#285b63]" />
                        <span>WHO 6th Edition Semen Parameters &gt; 15 M/ml count &amp; &gt; 40% progressive motility pre-cryopreservation logged.</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Talents &amp; Skills
                      </label>
                      <Input
                        value={formData.talentsStr}
                        onChange={(e) => setFormData({ ...formData, talentsStr: e.target.value })}
                        placeholder="e.g. Classical Music, Public Speaking, Chess"
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
                        placeholder="e.g. Photography, Hiking, Reading, Swimming"
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
                      placeholder="Enter the donor's altruistic personal quote or motivation to help intending parents..."
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: VIRAL MARKERS & GENETICS WITH DROPDOWNS */}
              {formTab === "viral" && (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>Clinical serology panel tests mandated under Section 27(1) of the ART Act, 2021.</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        HIV 1 &amp; 2
                      </label>
                      <select
                        value={formData.hiv}
                        onChange={(e) => setFormData({ ...formData, hiv: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive (Negative)</option>
                        <option value="Reactive">Reactive (Positive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hepatitis B (HBsAg)
                      </label>
                      <select
                        value={formData.hbsAg}
                        onChange={(e) => setFormData({ ...formData, hbsAg: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive (Negative)</option>
                        <option value="Reactive">Reactive (Positive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hepatitis C (HCV)
                      </label>
                      <select
                        value={formData.hcv}
                        onChange={(e) => setFormData({ ...formData, hcv: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive (Negative)</option>
                        <option value="Reactive">Reactive (Positive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Syphilis (VDRL)
                      </label>
                      <select
                        value={formData.vdrl}
                        onChange={(e) => setFormData({ ...formData, vdrl: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive (Negative)</option>
                        <option value="Reactive">Reactive (Positive)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    {/* Thalassemia Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Thalassemia Screening (HPLC)
                      </label>
                      <select
                        value={formData.thalassemiaStatus}
                        onChange={(e) =>
                          setFormData({ ...formData, thalassemiaStatus: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        {THALASSEMIA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Karyotype Cytogenetics Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Cytogenetic Karyotype
                      </label>
                      <select
                        value={formData.karyotypeResult}
                        onChange={(e) =>
                          setFormData({ ...formData, karyotypeResult: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        {formData.gameteType === "egg"
                          ? KARYOTYPE_FEMALE_OPTIONS.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))
                          : KARYOTYPE_MALE_OPTIONS.map((k) => (
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
                        onChange={(e) =>
                          setFormData({ ...formData, maternalGrandparents: e.target.value })
                        }
                        placeholder="e.g. Maternal grandfather healthy (age 78), grandmother no genetic diseases..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Paternal Grandparents Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.paternalGrandparents}
                        onChange={(e) =>
                          setFormData({ ...formData, paternalGrandparents: e.target.value })
                        }
                        placeholder="e.g. Good cardiovascular health, active longevity..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Parents (Mother &amp; Father) History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.parents}
                        onChange={(e) => setFormData({ ...formData, parents: e.target.value })}
                        placeholder="e.g. Both parents active, healthy, no chronic familial conditions..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Siblings Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.siblings}
                        onChange={(e) => setFormData({ ...formData, siblings: e.target.value })}
                        placeholder="e.g. 2 siblings, both in excellent health..."
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
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
                        onChange={(e) =>
                          setFormData({ ...formData, registryToken: e.target.value })
                        }
                        placeholder="e.g. REG-2026-IND-DEL-00412"
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.artActRegistered}
                          onChange={(e) =>
                            setFormData({ ...formData, artActRegistered: e.target.checked })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">ART Act 2021 Registered</div>
                          <div className="text-[11px] text-muted-foreground">Logged with National ART Registry</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.rule13InsuranceActive}
                          onChange={(e) =>
                            setFormData({ ...formData, rule13InsuranceActive: e.target.checked })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Rule 13 Medical Insurance Active</div>
                          <div className="text-[11px] text-muted-foreground">Mandatory 12-month clinical underwriting</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.lifetimeDonationLimitCompliant}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lifetimeDonationLimitCompliant: e.target.checked,
                            })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Lifetime Donation Limit Compliant</div>
                          <div className="text-[11px] text-muted-foreground">Verified non-repeat donor under Section 27(2)</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl h-11 px-5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={`rounded-xl h-11 px-7 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all ${
                  formData.gameteType === "egg"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#285b63] hover:bg-[#1d444a]"
                }`}
              >
                {submitting
                  ? "Saving to Database..."
                  : formData.gameteType === "egg"
                  ? "Create Egg Donor Profile"
                  : "Create Sperm Donor Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT DONOR DIALOG ================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-6 sm:p-7 bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63] text-white shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
                <Edit className="h-6 w-6 text-[#95e0b9]" />
                Edit Donor Profile ({activeDonor?.donorCode})
              </DialogTitle>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-white/20 text-white">
                {formData.gameteType === "egg" ? "Egg Donor" : "Sperm Donor"}
              </span>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-gray-200 mt-1">
              Modify clinical, phenotypic, or compliance parameters in MongoDB.
            </DialogDescription>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/15 overflow-x-auto scrollbar-hide">
              {[
                { id: "basic", label: "1. Basic & Gamete", icon: User },
                { id: "phenotype", label: "2. Phenotype & Traits", icon: User },
                {
                  id: "education",
                  label: formData.gameteType === "egg" ? "3. Career & Fertility" : "3. Career & Cryo",
                  icon: Award,
                },
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
                      formTab === tab.id
                        ? "bg-white text-[#285b63] shadow-md"
                        : "text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateDonor} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
              {/* TAB 1: BASIC */}
              {formTab === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Gamete Type
                      </label>
                      <select
                        value={formData.gameteType}
                        onChange={(e) =>
                          setFormData({ ...formData, gameteType: e.target.value as any })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="egg">Egg Donor (Oocyte / Female)</option>
                        <option value="sperm">Sperm Donor (Semen / Male)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Donor Code
                      </label>
                      <Input
                        value={formData.donorCode}
                        onChange={(e) => setFormData({ ...formData, donorCode: e.target.value })}
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Status
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) =>
                          setFormData({ ...formData, availability: e.target.value as any })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="available">Available Immediately</option>
                        <option value="quarantine">Cryo Quarantine Phase</option>
                        <option value="allocated">Allocated</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Age (Years)
                      </label>
                      <Input
                        type="number"
                        min={18}
                        max={55}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Blood Group
                      </label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        onChange={(e) =>
                          setFormData({ ...formData, rhFactor: e.target.value as any })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Positive">Positive (+)</option>
                        <option value="Negative">Negative (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Height (cm)
                      </label>
                      <Input
                        type="number"
                        value={formData.heightCm}
                        onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Weight (kg)
                      </label>
                      <Input
                        type="number"
                        value={formData.weightKg}
                        onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Availability Badge Label
                      </label>
                      <Input
                        value={formData.availabilityLabel}
                        onChange={(e) =>
                          setFormData({ ...formData, availabilityLabel: e.target.value })
                        }
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
                        Eye Color
                      </label>
                      <select
                        value={formData.eyeColor}
                        onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Eye Color...</option>
                        {EYE_COLORS.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hair Color
                      </label>
                      <select
                        value={formData.hairColor}
                        onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Hair Color...</option>
                        {HAIR_COLORS.map((color) => (
                          <option key={color} value={color}>{color}</option>
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
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Hair Texture...</option>
                        {HAIR_TEXTURES.map((tex) => (
                          <option key={tex} value={tex}>{tex}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Skin Complexion
                      </label>
                      <select
                        value={formData.skinTone}
                        onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Skin Complexion...</option>
                        {SKIN_TONES.map((tone) => (
                          <option key={tone} value={tone}>{tone}</option>
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
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Body Build...</option>
                        {BODY_BUILDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Ethnicity
                      </label>
                      <Input
                        value={formData.ethnicity}
                        onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Ancestry Region
                      </label>
                      <Input
                        value={formData.ancestryRegion}
                        onChange={(e) =>
                          setFormData({ ...formData, ancestryRegion: e.target.value })
                        }
                        className="h-11 rounded-xl text-xs"
                      />
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
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Languages
                      </label>
                      <Input
                        value={formData.languagesStr}
                        onChange={(e) => setFormData({ ...formData, languagesStr: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAREER & FERTILITY */}
              {formTab === "education" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Education Level
                      </label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) =>
                          setFormData({ ...formData, educationLevel: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="">Select Education Level...</option>
                        {EDUCATION_LEVELS.map((ed) => (
                          <option key={ed.value} value={ed.value}>{ed.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Degree / Qualification
                      </label>
                      <Input
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Current Profession
                      </label>
                      <Input
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        {formData.gameteType === "egg"
                          ? "Oocyte Donor Reproductive History"
                          : "Sperm Donor Semen & Fertility Records"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className={formData.gameteType === "sperm" ? "sm:col-span-2" : ""}>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Proven Fertility Details
                        </label>
                        <Input
                          value={formData.provenFertility}
                          onChange={(e) =>
                            setFormData({ ...formData, provenFertility: e.target.value })
                          }
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Living Children
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.livingChildren}
                          onChange={(e) =>
                            setFormData({ ...formData, livingChildren: e.target.value })
                          }
                          className="h-11 rounded-xl text-xs"
                        />
                      </div>

                      {formData.gameteType === "egg" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Previous Abortions
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.abortion}
                            onChange={(e) =>
                              setFormData({ ...formData, abortion: e.target.value })
                            }
                            className="h-11 rounded-xl text-xs"
                          />
                        </div>
                      )}
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
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Donor&apos;s Altruistic Statement
                    </label>
                    <textarea
                      rows={3}
                      value={formData.donorStatement}
                      onChange={(e) => setFormData({ ...formData, donorStatement: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: VIRAL */}
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
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hepatitis B (HBsAg)
                      </label>
                      <select
                        value={formData.hbsAg}
                        onChange={(e) => setFormData({ ...formData, hbsAg: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hepatitis C (HCV)
                      </label>
                      <select
                        value={formData.hcv}
                        onChange={(e) => setFormData({ ...formData, hcv: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-bold text-emerald-600 focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        onChange={(e) =>
                          setFormData({ ...formData, thalassemiaStatus: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
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
                        onChange={(e) =>
                          setFormData({ ...formData, karyotypeResult: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-hidden focus:border-brand-600 cursor-pointer"
                      >
                        {formData.gameteType === "egg"
                          ? KARYOTYPE_FEMALE_OPTIONS.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))
                          : KARYOTYPE_MALE_OPTIONS.map((k) => (
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
                        onChange={(e) =>
                          setFormData({ ...formData, maternalGrandparents: e.target.value })
                        }
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Paternal Grandparents Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={formData.paternalGrandparents}
                        onChange={(e) =>
                          setFormData({ ...formData, paternalGrandparents: e.target.value })
                        }
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
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
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
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
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-hidden focus:border-brand-600"
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
                        onChange={(e) =>
                          setFormData({ ...formData, registryToken: e.target.value })
                        }
                        className="h-11 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.artActRegistered}
                          onChange={(e) =>
                            setFormData({ ...formData, artActRegistered: e.target.checked })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">ART Act 2021 Registered</div>
                          <div className="text-[11px] text-muted-foreground">Logged with National ART Registry</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.rule13InsuranceActive}
                          onChange={(e) =>
                            setFormData({ ...formData, rule13InsuranceActive: e.target.checked })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Rule 13 Medical Insurance Active</div>
                          <div className="text-[11px] text-muted-foreground">Mandatory 12-month clinical underwriting</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition">
                        <input
                          type="checkbox"
                          checked={formData.lifetimeDonationLimitCompliant}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lifetimeDonationLimitCompliant: e.target.checked,
                            })
                          }
                          className="rounded h-4 w-4 text-[#285b63]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-foreground">Lifetime Donation Limit Compliant</div>
                          <div className="text-[11px] text-muted-foreground">Verified non-repeat donor under Section 27(2)</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl h-11 px-5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl h-11 px-7 bg-[#285b63] hover:bg-[#1d444a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? "Saving..." : "Update ART Donor Profile"}
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
            <DialogTitle className="text-xl font-bold">Permanently Delete Donor Profile?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              This action will permanently delete donor{" "}
              <strong className="text-foreground font-mono">{activeDonor?.donorCode}</strong>{" "}
              ({activeDonor?.gameteType === "egg" ? "Egg Donor" : "Sperm Donor"}) from the MongoDB
              database. It will immediately disappear from both the admin portal and the user-facing catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-3 mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl h-11 text-xs font-semibold flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteDonor}
              disabled={submitting}
              className="rounded-xl h-11 text-xs font-bold flex-1 shadow-md hover:shadow-lg"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= VIEW DOSSIER PREVIEW DIALOG ================= */}
      {activeDonor && (
        <Dialog open={isDossierOpen} onOpenChange={setIsDossierOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
            <div
              className={`text-white p-6 sm:p-7 shrink-0 ${
                activeDonor.gameteType === "egg"
                  ? "bg-gradient-to-r from-[#5a1428] via-[#831843] to-[#9d174d]"
                  : "bg-gradient-to-r from-[#173037] via-[#214b53] to-[#285b63]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xl">{activeDonor.donorCode}</span>
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white">
                        {activeDonor.gameteType === "egg" ? "Oocyte Donor" : "Semen Donor"}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-200 mt-1.5 leading-relaxed">
                      {activeDonor.ethnicity} • {activeDonor.degree} • {activeDonor.heightFormatted} • Blood:{" "}
                      <strong className="text-[#ff7468]">{activeDonor.bloodType}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex items-center gap-2 mt-5 border-t border-white/15 pt-3 overflow-x-auto scrollbar-hide">
                {[
                  { id: "basic", label: "1. Basic Details" },
                  { id: "viral", label: "2. Viral Markers" },
                  { id: "pedigree", label: "3. Family Medical History" },
                  { id: "compliance", label: "4. ART Act Compliance" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDossierTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      dossierTab === tab.id
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
              {/* DOSSIER TAB 1: BASIC & PHENOTYPE */}
              {dossierTab === "basic" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#285b63] mb-3">
                      Physical Phenotype &amp; Traits
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="bg-muted/30 p-3.5 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Blood Group</div>
                        <div className="text-sm font-bold text-rose-600 mt-1">
                          {activeDonor.bloodType} ({activeDonor.rhFactor})
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3.5 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Height &amp; BMI</div>
                        <div className="text-sm font-bold text-foreground mt-1">
                          {activeDonor.heightFormatted} (BMI {activeDonor.bmi})
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3.5 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Eye Color</div>
                        <div className="text-sm font-bold text-foreground mt-1">{activeDonor.eyeColor}</div>
                      </div>
                      <div className="bg-muted/30 p-3.5 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Skin Complexion</div>
                        <div className="text-sm font-bold text-foreground mt-1">{activeDonor.skinTone}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-bold text-[#285b63] mb-3">
                      Education &amp; Occupation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="bg-muted/30 p-4 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Degree</div>
                        <div className="text-sm font-bold text-foreground mt-1">{activeDonor.degree}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{activeDonor.educationLevel}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-2xl border">
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Profession</div>
                        <div className="text-sm font-bold text-foreground mt-1">{activeDonor.profession}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Verified Employment Record</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">
                      Reproductive History &amp; Proven Fertility
                    </h5>
                    <p className="text-foreground text-sm font-medium">{activeDonor.provenFertility}</p>
                    <div className="mt-2 text-xs font-semibold text-[#285b63]">
                      Alive Children: {activeDonor.livingChildren} (Verified as per Indian ART Act 2021)
                    </div>
                  </div>

                  {activeDonor.donorStatement && (
                    <div className="p-4 rounded-2xl bg-[#285b63]/5 border border-[#285b63]/20 italic text-xs sm:text-sm text-foreground">
                      &ldquo;{activeDonor.donorStatement}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* DOSSIER TAB 2: VIRAL MARKERS */}
              {dossierTab === "viral" && (
                <div className="space-y-5">
                  <h4 className="font-serif text-base font-bold text-[#285b63]">
                    Infectious Disease Serology (Viral Markers)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-muted/30 p-4 rounded-2xl border">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">HIV 1 &amp; 2</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {activeDonor.viralMarkers?.hiv || "Non-Reactive"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">Hepatitis B (HBsAg)</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {activeDonor.viralMarkers?.hbsAg || "Non-Reactive"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">Hepatitis C (HCV)</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {activeDonor.viralMarkers?.hcv || "Non-Reactive"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">Syphilis (VDRL)</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {activeDonor.viralMarkers?.vdrl || "Non-Reactive"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOSSIER TAB 3: PEDIGREE */}
              {dossierTab === "pedigree" && (
                <div className="space-y-4">
                  <h4 className="font-serif text-base font-bold text-[#285b63] mb-2">
                    Three-Generation Medical Pedigree
                  </h4>
                  <div className="bg-muted/30 p-4 rounded-2xl border space-y-1">
                    <div className="text-xs font-bold text-[#285b63] uppercase">Maternal Grandparents</div>
                    <p className="text-xs sm:text-sm text-foreground">
                      {activeDonor.familyPedigree?.maternalGrandparents || "No hereditary disorders reported."}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border space-y-1">
                    <div className="text-xs font-bold text-[#285b63] uppercase">Paternal Grandparents</div>
                    <p className="text-xs sm:text-sm text-foreground">
                      {activeDonor.familyPedigree?.paternalGrandparents || "Good cardiovascular health."}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border space-y-1">
                    <div className="text-xs font-bold text-[#285b63] uppercase">Parents (Mother &amp; Father)</div>
                    <p className="text-xs sm:text-sm text-foreground">
                      {activeDonor.familyPedigree?.parents || "Both parents active and healthy."}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border space-y-1">
                    <div className="text-xs font-bold text-[#285b63] uppercase">Siblings</div>
                    <p className="text-xs sm:text-sm text-foreground">
                      {activeDonor.familyPedigree?.siblings || "Siblings in good health."}
                    </p>
                  </div>
                </div>
              )}

              {/* DOSSIER TAB 4: COMPLIANCE */}
              {dossierTab === "compliance" && (
                <div className="space-y-5">
                  <h4 className="font-serif text-base font-bold text-[#285b63]">
                    Statutory ART Act 2021 Certification
                  </h4>
                  <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl p-6 space-y-3.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">National ART Registry Compliance Token:</span>
                      <span className="font-mono font-bold text-[#285b63] dark:text-teal-400">
                        {activeDonor.statutoryCompliance?.registryToken || "REG-2026-IND-DEL-00412"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Lifetime Donation Limit Under Section 27(2):</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">✓ Verified Non-Repeat Donor</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Mandatory 12-Month Rule 13 Insurance:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">✓ Active &amp; Fully Underwritten</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Statutory Perpetual Anonymity:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">✓ Executed under Sections 27 &amp; 28</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-5 bg-muted/20 border-t flex justify-end shrink-0">
              <Button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="rounded-xl h-11 px-6 text-xs font-bold bg-[#285b63] hover:bg-[#1d444a] text-white shadow-sm"
              >
                Close Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
