"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function TeamForm({ addTeamAction }: { addTeamAction: (formData: FormData) => void }) {
  const [logoUrl, setLogoUrl] = useState("");

  return (
    <form action={addTeamAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">Team Name</Label>
        <Input id="name" name="name" placeholder="e.g. Bandhan XI" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="initials" className="text-xs">Initials</Label>
        <Input id="initials" name="initials" placeholder="e.g. BXI" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-xs">Location</Label>
        <Input id="location" name="location" placeholder="e.g. Beltala" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logo" className="text-xs">Logo URL</Label>
        <Input 
          id="logo" 
          name="logo" 
          placeholder="https://..." 
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        {logoUrl && (
          <div className="mt-2 flex justify-center p-2 border border-border/50 rounded-md bg-muted/20">
            <img src={logoUrl} alt="Logo Preview" className="h-16 w-16 object-contain rounded-full bg-primary/10" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" size="sm">
        Create Team
      </Button>
    </form>
  );
}
