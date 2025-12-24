import React from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Icon } from "@/app/components/ui/Icon";

type GameBasicInfoFormData = {
  name: string;
  password: string;
};

type Props = {
  formData: GameBasicInfoFormData;
  setFormData: (data: GameBasicInfoFormData) => void;
  onNext: () => void;
};

export function GameBasicInfo({ formData, setFormData, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          type="text"
          id="gameName"
          label="Game Name"
          placeholder="My Epic Adventure"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Input
          type="text"
          id="password"
          label="Game Password"
          placeholder="Enter a password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        <p className="mt-2 text-sm text-gray-400">
          <Icon name="info" className="inline text-base mr-1" />
          Other players will need this password to join the game
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary">
          Next
          <Icon name="arrow_forward" className="ml-2 text-lg" />
        </Button>
      </div>
    </form>
  );
}
