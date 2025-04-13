"use client";

import { useState } from "react";
import {
  Button,
  NumberInput,
  Dialog,
  DialogPanel,
} from "@tremor/react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types/user";

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    points: user.points,
    level: user.level,
    isEarlyAdopter: user.isEarlyAdopter || false,
    isBanned: user.isBanned || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, formData);

      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel>
        <h3 className="text-lg font-semibold mb-4">Edit User</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <NumberInput
              value={formData.points}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  points: value ?? 0,
                }))
              }
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <NumberInput
              value={formData.level}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  level: value ?? 1,
                }))
              }
              min={1}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isEarlyAdopter}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isEarlyAdopter: e.target.checked,
                  }))
                }
                className="rounded text-blue-500"
              />
              Early Adopter
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isBanned}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isBanned: e.target.checked,
                  }))
                }
                className="rounded text-red-500"
              />
              Banned
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} disabled={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
    }
