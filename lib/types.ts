export interface Cut {
  cutNumber: number;
  sceneDescription: string;
  characters: string[];
  dialogue: string | null;
  shotType: string;
  setting: string;
  mood: string;
  estimatedDurationSeconds: number;
}

export type CutImageStatus = "idle" | "loading" | "success" | "failed";

export interface CutWithImage extends Cut {
  imageUrl: string | null;
  imageStatus: CutImageStatus;
}

export interface SegmentResponse {
  cuts: Cut[];
}

export interface SegmentErrorResponse {
  error: string;
}

export interface GenerateCutImageRequestBody {
  sceneDescription: string;
  characters: string[];
  setting: string;
  shotType: string;
  mood: string;
}

export interface GenerateCutImageResponse {
  imageUrl: string | null;
  error?: string;
}
