// 게임 공용 난이도 설정. 어려울수록 문제가 많고/길고, 포인트 배수도 커진다.
// 실제 포인트 계산(배수)은 서버(app/api/games/submit)가 권위 있게 처리한다 —
// 여기 mult 는 화면 안내용.

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTIES: {
  key: Difficulty;
  label: string;
  mult: number;
  desc: string;
}[] = [
  { key: "EASY", label: "쉬움", mult: 1, desc: "천천히 · 기본 포인트" },
  { key: "MEDIUM", label: "보통", mult: 2, desc: "조금 더 · 포인트 2배" },
  { key: "HARD", label: "어려움", mult: 3, desc: "도전! · 포인트 3배" },
];

// 4지선다 류(단어/숫자/색깔) 한 판의 문제 수
export const QUESTION_COUNT: Record<Difficulty, number> = {
  EASY: 6,
  MEDIUM: 10,
  HARD: 14,
};
