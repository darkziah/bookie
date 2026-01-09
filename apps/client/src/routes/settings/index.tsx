import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@bookie/ui/components/ui/button";
import { Input } from "@bookie/ui/components/ui/input";
import { Label } from "@bookie/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import { Separator } from "@bookie/ui/components/ui/separator";
import {
  IconLoader2,
  IconDeviceFloppy,
  IconBook,
  IconSchool,
  IconClock,
  IconCalendar,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <SettingsContent />
    </AppLayout>
  );
}

function SettingsContent() {
  const settings = useQuery(api.settings.getAll, {});
  const setSetting = useMutation(api.settings.set);
  const initDefaults = useMutation(api.settings.initializeDefaults);

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    libraryName: "",
    borrowingDays: "14",
    maxRenewals: "2",
    overdueGracePeriod: "0",
    kioskTimeout: "30",
    accessionPrefix: "B",
    currency: "PHP",
    // Borrowing limits by grade
    limit_1_3: "1",
    limit_4_6: "2",
    limit_7_10: "5",
    limit_11_12: "7",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        schoolName: settings.schoolName || "",
        libraryName: settings.libraryName || "",
        borrowingDays: String(settings.borrowingDays || 14),
        maxRenewals: String(settings.maxRenewals || 2),
        overdueGracePeriod: String(settings.overdueGracePeriod || 0),
        kioskTimeout: String(settings.kioskTimeout || 30),
        accessionPrefix: settings.accessionPrefix || "B",
        currency: settings.currency || "PHP",
        limit_1_3: String(settings.borrowingLimits?.["1-3"] || 1),
        limit_4_6: String(settings.borrowingLimits?.["4-6"] || 2),
        limit_7_10: String(settings.borrowingLimits?.["7-10"] || 5),
        limit_11_12: String(settings.borrowingLimits?.["11-12"] || 7),
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save individual settings
      await setSetting({ key: "schoolName", value: formData.schoolName });
      await setSetting({ key: "libraryName", value: formData.libraryName });
      await setSetting({ key: "borrowingDays", value: parseInt(formData.borrowingDays) });
      await setSetting({ key: "maxRenewals", value: parseInt(formData.maxRenewals) });
      await setSetting({ key: "overdueGracePeriod", value: parseInt(formData.overdueGracePeriod) });
      await setSetting({ key: "kioskTimeout", value: parseInt(formData.kioskTimeout) });
      await setSetting({ key: "accessionPrefix", value: formData.accessionPrefix });
      await setSetting({ key: "currency", value: formData.currency });
      await setSetting({
        key: "borrowingLimits",
        value: {
          "1-3": parseInt(formData.limit_1_3),
          "4-6": parseInt(formData.limit_4_6),
          "7-10": parseInt(formData.limit_7_10),
          "11-12": parseInt(formData.limit_11_12),
        },
      });

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitDefaults = async () => {
    try {
      await initDefaults({});
      toast.success("Default settings initialized!");
    } catch (error: any) {
      toast.error("Failed to initialize defaults", { description: error.message });
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground">Configure library system settings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleInitDefaults} className="w-full sm:w-auto">
            <IconRefresh className="mr-2 h-4 w-4" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* School Information */}
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <IconSchool className="h-4 w-4 text-primary" />
              School Information
            </CardTitle>
            <CardDescription className="text-xs">Basic information about your school and library</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-xs">School Name</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Enter school name"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libraryName" className="text-xs">Library Name</Label>
              <Input
                id="libraryName"
                value={formData.libraryName}
                onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                placeholder="Enter library name"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-xs">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="PHP"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessionPrefix" className="text-xs">Accession Number Prefix</Label>
              <Input
                id="accessionPrefix"
                value={formData.accessionPrefix}
                onChange={(e) => setFormData({ ...formData, accessionPrefix: e.target.value })}
                placeholder="B"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Settings */}
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <IconBook className="h-4 w-4 text-primary" />
              Borrowing Settings
            </CardTitle>
            <CardDescription className="text-xs">Configure borrowing periods and renewal policies</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="borrowingDays" className="text-xs">Borrowing Days</Label>
              <Input
                id="borrowingDays"
                type="number"
                value={formData.borrowingDays}
                onChange={(e) => setFormData({ ...formData, borrowingDays: e.target.value })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Default loan period</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRenewals" className="text-xs">Max Renewals</Label>
              <Input
                id="maxRenewals"
                type="number"
                value={formData.maxRenewals}
                onChange={(e) => setFormData({ ...formData, maxRenewals: e.target.value })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Per transaction</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overdueGracePeriod" className="text-xs">Grace Period (days)</Label>
              <Input
                id="overdueGracePeriod"
                type="number"
                value={formData.overdueGracePeriod}
                onChange={(e) => setFormData({ ...formData, overdueGracePeriod: e.target.value })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Before marking overdue</p>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Limits by Grade */}
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-primary" />
              Borrowing Limits by Grade
            </CardTitle>
            <CardDescription className="text-xs">Maximum books a student can borrow at once</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs">Grade 1-3</Label>
              <Input
                type="number"
                value={formData.limit_1_3}
                onChange={(e) => setFormData({ ...formData, limit_1_3: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Grade 4-6</Label>
              <Input
                type="number"
                value={formData.limit_4_6}
                onChange={(e) => setFormData({ ...formData, limit_4_6: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Grade 7-10</Label>
              <Input
                type="number"
                value={formData.limit_7_10}
                onChange={(e) => setFormData({ ...formData, limit_7_10: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Grade 11-12</Label>
              <Input
                type="number"
                value={formData.limit_11_12}
                onChange={(e) => setFormData({ ...formData, limit_11_12: e.target.value })}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Kiosk Settings */}
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <IconClock className="h-4 w-4 text-primary" />
              Kiosk Settings
            </CardTitle>
            <CardDescription className="text-xs">Configuration for the student self-service kiosk</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kioskTimeout" className="text-xs">Auto-logout Timeout (seconds)</Label>
              <Input
                id="kioskTimeout"
                type="number"
                value={formData.kioskTimeout}
                onChange={(e) => setFormData({ ...formData, kioskTimeout: e.target.value })}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Kiosk will auto-logout after this period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Save Button at bottom */}
      <div className="flex justify-end pb-8">
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-12">
          {isSaving ? (
            <>
              <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <IconDeviceFloppy className="mr-2 h-5 w-5" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
