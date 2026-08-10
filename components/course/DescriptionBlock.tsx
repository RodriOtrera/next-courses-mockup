"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import {
  updateModuleItemDescription,
  deleteModuleItemDescription,
} from "@/lib/db/actions/edit/preview_actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  ChevronDown,
} from "lucide-react";

interface DescriptionBlockProps {
  description: string;
  transcription?: string | null;
  moduleItemId: string;
  courseId: string;
}

export function DescriptionBlock({
  description,
  transcription,
  moduleItemId,
  courseId,
}: DescriptionBlockProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);
  const [showTranscription, setShowTranscription] = useState(false);

  const { execute: execUpdate, isPending: isUpdating } = useAction(
    updateModuleItemDescription,
    {
      onSuccess: () => {
        setEditing(false);
        router.refresh();
      },
    }
  );

  const { execute: execDelete, isPending: isDeleting } = useAction(
    deleteModuleItemDescription,
    {
      onSuccess: () => {
        router.refresh();
      },
    }
  );

  const handleSave = () => {
    if (!editValue.trim()) return;
    execUpdate({ moduleItemId, description: editValue.trim(), courseId });
  };

  const handleDelete = () => {
    execDelete({ moduleItemId, courseId });
  };

  return (
    <div className="space-y-3">
      {/* Description */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">
              Descripcion
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-white/[0.08] min-w-[160px]"
            >
              <DropdownMenuItem
                onClick={() => {
                  setEditValue(description);
                  setEditing(true);
                }}
                className="text-white/70 hover:text-white focus:text-white focus:bg-white/[0.06] gap-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar descripcion
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 gap-2 text-xs"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Eliminar descripcion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-purple-500/30 focus:outline-none resize-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating || !editValue.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-base leading-relaxed text-white/70">
            {description}
          </p>
        )}
      </div>

      {/* Transcription */}
      {transcription && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="w-full flex items-center justify-between p-4 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
                Transcripcion completa
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${
                showTranscription ? "rotate-180" : ""
              }`}
            />
          </button>
          {showTranscription && (
            <div className="px-6 pb-6 pt-0">
              <p className="text-sm leading-relaxed text-white/50 whitespace-pre-wrap">
                {transcription}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
