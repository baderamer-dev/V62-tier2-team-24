"use client";

import type { z } from "zod";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPathSchema, type CreatePathValues } from "../schema";
import { generatePath } from "../api";
import { useRouter } from "next/navigation";
import { SkillLevelField } from "./skill-level-field";
import { WeeklyHoursField } from "./weekly-hours-field";
import { GeneratingPathOverlay } from "./generating-path-overlay";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewPathForm() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<
    z.input<typeof createPathSchema>,
    unknown,
    CreatePathValues
  >({
    resolver: zodResolver(createPathSchema),
    defaultValues: {
      careerGoal: "",
      skillLevel: "beginner",
      background: "",
      weeklyHours: undefined,
    },
  });

  const onSubmit = async (values: CreatePathValues) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await generatePath(values);
      if (response?.id) {
        sessionStorage.setItem(
          `learning-path:${response.id}`,
          JSON.stringify(response),
        );
        localStorage.setItem(
          `learning-path:${response.id}`,
          JSON.stringify(response),
        );
        localStorage.setItem("last-learning-path-id", response.id);
        router.push(`/paths/${response.id}`);
      }
      setIsGenerating(false);
    } catch (error) {
      console.error("Failed to generate path:", error);
      setError(
        "Something went wrong while generating your path. Please try again.",
      );
      setIsGenerating(false);
    }
  };

  return (
    <Card className="relative max-w-2xl mx-auto overflow-hidden border shadow-sm">
      {isGenerating ? <GeneratingPathOverlay /> : null}
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Create Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          aria-busy={isGenerating}
        >
          <fieldset disabled={isGenerating} className="space-y-6 border-0 p-0">
            <FieldGroup className="space-y-6">
              {/* Career Goal */}
              <Controller
                name="careerGoal"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Career / Learning Goal{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      e.g. &quot;Become a Frontend Developer&quot;, &quot;Learn
                      Machine Learning&quot;
                    </FieldDescription>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Enter your goal..."
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Skill Level - Custom Radio Cards */}
              <Controller
                name="skillLevel"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Current Skill Level{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Select your current proficiency level.
                    </FieldDescription>
                    <SkillLevelField field={field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Background */}
              <Controller
                name="background"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Background & Experience
                    </FieldLabel>
                    <FieldDescription>
                      Briefly describe your existing knowledge or relevant
                      experience.
                    </FieldDescription>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Tell us a bit about your context..."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Weekly Hours - Custom Radio Cards */}
              <Controller
                name="weeklyHours"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Available Study Time / Week{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldDescription>
                      Select how many hours per week you can commit.
                    </FieldDescription>
                    <WeeklyHoursField field={field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              className="w-full"
              disabled={isGenerating || form.formState.isSubmitting}
            >
              {isGenerating ? "Generating Path..." : "Generate Learning Path"}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
