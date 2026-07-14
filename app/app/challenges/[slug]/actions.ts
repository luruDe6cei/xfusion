'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { deleteChallenge } from '@/lib/data';

export async function removeChallenge(slug: string): Promise<void> {
  await deleteChallenge(slug);
  revalidatePath('/challenges');
  revalidatePath('/explore');
  revalidatePath('/');
  redirect('/challenges');
}
