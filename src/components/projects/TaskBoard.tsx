"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

interface TaskData {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  estimatedHours: number;
  actualHours: number;
  dueDate?: string | null;
  dependencies: string[];
  order: number;
  subtasks: { _id: string; title: string; status: string }[];
}

interface TaskBoardProps {
  projectId: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTasks(reordered);

    const newOrder = reordered.map((t) => t._id);
    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: newOrder }),
      });
      if (!res.ok) throw new Error("Failed to save order");
    } catch {
      toast.error("Could not save task order");
      fetchTasks();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      if (newStatus === "completed") {
        setCompletedTaskId(taskId);
        setTimeout(() => setCompletedTaskId(null), 2000);
      }
    } catch {
      toast.error("Status update failed");
      fetchTasks();
    }
  };

  const handleTaskCreated = (newTask: TaskData) => {
    setTasks((prev) => [...prev, newTask]);
    setCreateOpen(false);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe what tasks to generate.");
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/ai-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiPrompt }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI generation failed");
      }
      const data = await res.json();
      toast.success(`AI created ${data.totalTasks} tasks!`);
      setAiPrompt("");
      setShowAiPrompt(false);
      fetchTasks(); // Refresh task list
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTasks} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Project Tasks</h2>
          <p className="text-xs text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · Drag to reorder
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiPrompt(!showAiPrompt)}
            className="border-primary/30 text-primary"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            AI Generate
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="btn-gradient gap-1.5">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* AI Prompt Area */}
      {showAiPrompt && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Describe the work, AI will create tasks:</p>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Build a responsive website with homepage, about, contact, and payment integration in 3 weeks"
            className="bg-white/5 border-white/10 min-h-[80px]"
            disabled={aiGenerating}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAiPrompt(false)}
              disabled={aiGenerating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="btn-gradient"
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Generate Tasks
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-card/50">
          <p className="text-muted-foreground">
            No tasks yet. Use AI Generate or add manually.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task._id} draggableId={task._id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-transform ${
                          snapshot.isDragging ? "scale-[1.02] shadow-lg" : ""
                        }`}
                      >
                        <TaskCard
                          task={task}
                          onStatusChange={handleStatusChange}
                          isCompleted={task.status === "completed"}
                          showCompletionAnimation={completedTaskId === task._id}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}