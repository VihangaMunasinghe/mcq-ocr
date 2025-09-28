"use client";

import React, { createContext, useContext } from "react";
import { MarkingJob } from "@/app/marking-jobs/create/components/types";
import { useState } from "react";

const CreateMarkingContext = createContext<
  [MarkingJob, React.Dispatch<React.SetStateAction<MarkingJob>>] | undefined
>(undefined);

const CreateMarkingProvider = ({ children }: { children: React.ReactNode }) => {
  const [markingJob, setMarkingJob] = useState<MarkingJob>({
    id: null,
    name: null,
    template_id: null,
    markingSchemeFileId: null,
    markingSchemeFile: null,
    answerSheetsFileId: null,
    answerSheetsFile: null,
    save_intermediate_results: null,
  });

  return (
    <CreateMarkingContext.Provider value={[markingJob, setMarkingJob]}>
      {children}
    </CreateMarkingContext.Provider>
  );
};

export const useCreateMarking = () => {
  const context = useContext(CreateMarkingContext);
  if (context === undefined) {
    throw new Error(
      "useCreateMarking must be used within a CreateMarkingProvider"
    );
  }
  return context;
};

export default CreateMarkingProvider;
