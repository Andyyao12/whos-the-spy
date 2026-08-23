// 房间码：6 位纯数字，前后端共用清洗逻辑
export function cleanRoomCode(input: string): string {
  return input
    .replace(/[\s　]/g, "") // 去掉半角/全角空格
    .replace(/[^0-9]/g, ""); // 只保留数字
}

export function isValidRoomCode(code: string): boolean {
  return /^[0-9]{6}$/.test(code);
}

export function randomRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}
