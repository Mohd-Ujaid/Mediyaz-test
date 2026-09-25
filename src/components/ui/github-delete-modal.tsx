"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface GitHubDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedId: string;
  itemType?: string;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function GitHubDeleteModal({
  open,
  onOpenChange,
  expectedId,
  itemType = "registration",
  itemName,
  onConfirm,
  loading = false,
}: GitHubDeleteModalProps) {
  const [inputText, setInputText] = React.useState("");

  // Reset input whenever dialog opens or expectedId changes
  React.useEffect(() => {
    if (open) {
      setInputText("");
    }
  }, [open, expectedId]);

  const isMatched = inputText.trim() === expectedId.trim();

  const handleDelete = async () => {
    if (!isMatched || loading) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!loading) onOpenChange(val); }}>
      <DialogContent className="max-w-lg rounded-2xl p-6 bg-background border shadow-2xl space-y-4">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Delete {itemType} permanently?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                This action is irreversible and destructive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Warning card */}
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-rose-700 dark:text-rose-400">
            Unexpected bad things will happen if you don't read this!
          </p>
          <p>
            This action <strong className="font-semibold">CANNOT</strong> be undone. This will permanently delete the{" "}
            {itemType} record for <span className="font-mono font-bold bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">{expectedId}</span>
            {itemName && (
              <span> (<strong className="font-medium">{itemName}</strong>)</span>
            )}
            , along with all associated clinical documents, audit trails, and file links.
          </p>
        </div>

        {/* Verification prompt */}
        <div className="space-y-2 text-xs">
          <label className="text-muted-foreground font-medium block">
            To confirm deletion, please enter the registration ID{" "}
            <span className="font-mono font-bold text-foreground select-all bg-muted px-1.5 py-0.5 rounded border border-border">
              {expectedId}
            </span>{" "}
            below:
          </label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter "${expectedId}" to verify`}
            disabled={loading}
            className="font-mono text-sm h-10 border-rose-200 focus-visible:ring-rose-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && isMatched && !loading) {
                handleDelete();
              }
            }}
          />
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 px-4 text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDelete}
            disabled={!isMatched || loading}
            className={`h-9 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              isMatched
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/20"
                : "bg-rose-200 dark:bg-rose-950/40 text-rose-400 dark:text-rose-600 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                I understand the consequences, delete this
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
