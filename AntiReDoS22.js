/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 *
 * ※ Enmity는 ES Module import 문법 미지원 → 글로벌 enmity 객체 사용
 */

const { registerPlugin } = enmity.managers.plugins;
const { getByProps } = enmity.metro;
const Patcher = enmity.patcher;

// ─── 입력 새니타이즈 ────────────────────────────────────────────────────────
function sanitizeInput(text) {
    if (typeof text !== "string") return text;

    // 1단계: 중첩 [ 구조가 과도하게 반복되는 경우 선제 차단
    //         JSC(iOS JS 엔진)는 백트래킹 제한이 없어 그대로 두면 앱이 멈춤
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");

    // 2단계: Vencord 방식 — 취약 파서를 트리거하는 말미 패턴 제거
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");

    return text;
}

// ─── 마크다운 파서 모듈 탐색 ────────────────────────────────────────────────
function findMarkdownModule() {
    // 전략 1: PC Discord / 일부 iOS 버전
    const m1 = getByProps("defaultBlockParse");
    if (m1) return { module: m1, method: "defaultBlockParse" };

    // 전략 2: iOS Discord 주요 버전
    const m2 = getByProps("parse", "parseBlock");
    if (m2) return { module: m2, method: "parse" };

    // 전략 3: markdownToAST 방식
    const m3 = getByProps("markdownToAST");
    if (m3) return { module: m3, method: "markdownToAST" };

    // 전략 4: renderRule 기반 파서
    const m4 = getByProps("renderRule", "parse");
    if (m4 && m4.parse) return { module: m4, method: "parse" };

    return null;
}

// ─── 플러그인 본체 ──────────────────────────────────────────────────────────
const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.2.0",
    description: "무량공처(ReDoS) 공격 차단 — iOS Enmity 전용",
    authors: [{ name: "A", id: "0" }],

    _patches: [],

    onStart() {
        let found;
        try {
            found = findMarkdownModule();
        } catch (e) {
            console.error("[AntiReDoS] 모듈 탐색 중 오류:", e);
            return;
        }

        if (!found) {
            console.warn("[AntiReDoS] 마크다운 파서 모듈을 찾지 못했습니다. 패치 건너뜀.");
            return;
        }

        const { module, method } = found;

        try {
            const unpatch = Patcher.before("AntiReDoS", module, method, (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });
            this._patches.push(unpatch);
            console.log(`[AntiReDoS] 활성화됨 — 패치 대상: ${method}`);
        } catch (e) {
            console.error("[AntiReDoS] 패치 실패:", e);
        }
    },

    onStop() {
        for (const unpatch of this._patches) {
            try { unpatch(); } catch (_) {}
        }
        this._patches = [];
        console.log("[AntiReDoS] 비활성화됨");
    },
};

registerPlugin(AntiReDoS);
