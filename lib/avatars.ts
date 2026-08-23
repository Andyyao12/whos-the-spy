// 玩家可选头像库（emoji）
export const AVATARS: string[] = [
  "🐼", "🦊", "🐸", "🐯", "🐵", "🐶", "🐱", "🐰",
  "🐻", "🐨", "🐷", "🐮", "🐹", "🐺", "🦁", "🦄",
  "🐧", "🐤", "🦉", "🦋", "🐬", "🐳", "🐙", "🦈",
  "🦖", "🐲", "🦸", "🧙", "👻", "🤖",
];

export function isValidAvatar(avatar: string): boolean {
  return AVATARS.includes(avatar);
}
