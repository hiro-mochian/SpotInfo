import { z } from "zod";

const requiredText = (label: string, limit: number) =>
  z.string().trim().min(1, `${label}を入力してください。`).max(limit, `${label}は${limit}文字以内で入力してください。`);

export const createSpotSchema = z.object({
  name: requiredText("スポット名", 200),
  area: requiredText("エリア", 200),
  category: requiredText("カテゴリー", 100),
  note: requiredText("ひとこと", 2000),
  lat: z.coerce.number().finite().min(-90, "緯度は-90以上で入力してください。").max(90, "緯度は90以下で入力してください。"),
  lng: z.coerce.number().finite().min(-180, "経度は-180以上で入力してください。").max(180, "経度は180以下で入力してください。"),
});

export const updateSpotSchema = createSpotSchema.pick({ name: true, area: true, category: true, note: true }).extend({
  id: z.coerce.number().int().positive(),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

export function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容を確認してください。";
}
