import { auth } from '../../firebase';
import type { ResumeDocument } from './resumeModel';
import type { SerializedLayoutPlan } from './layout';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const generateResumePdf = async (
  resume: ResumeDocument,
  layoutPlan?: SerializedLayoutPlan | null,
): Promise<Blob> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to generate a PDF.');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}/api/resumes/${encodeURIComponent(resume.id)}/pdf`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resume, layoutPlan }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || 'Unable to generate PDF.');
  }

  return response.blob();
};