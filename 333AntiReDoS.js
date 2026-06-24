/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 */

// ─── Enmity API (window.enmity 글로벌 객체) ────────────────────────────────
const patcher = window.enmity.patcher.create("AntiReDoS");
const getByProps = (...props) => window.enmity.modules.getByProps(...props);

// ─── 입력 새니타이즈 ────────────────────────────────────────────────────────
function sanitizeInput(text) {
    if (typeof text !== "string") return text;
    // 중첩 [ 구조 과도 반복 선제 차단
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");
    // Vencord 방식 — 취약 파서 트리거 패턴 제거
    text = text.replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
    return text;
}

// ─── 마크다운 파서 모듈 탐색 ────────────────────────────────────────────────
function findMarkdownModule() {
    const m1 = getByProps("defaultBlockParse");
    if (m1) return { module: m1, method: "defaultBlockParse" };

    const m2 = getByProps("parse", "parseBlock");
    if (m2) return { module: m2, method: "parse" };

    const m3 = getByProps("markdownToAST");
    if (m3) return { module: m3, method: "markdownToAST" };

    const m4 = getByProps("renderRule", "parse");
    if (m4 && m4.parse) return { module: m4, method: "parse" };

    return null;
}

// ─── 플러그인 본체 ──────────────────────────────────────────────────────────
const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.3.0",
    description: "무량공처(ReDoS) 공격 차단",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        const found = findMarkdownModule();

        if (!found) {
            console.warn("[AntiReDoS] 마크다운 파서 모듈을 찾지 못했습니다.");
            return;
        }

        try {
            patcher.before(found.module, found.method, (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });
            console.log("[AntiReDoS] 활성화 — 대상:", found.method);
        } catch (e) {
            console.error("[AntiReDoS] 패치 실패:", e);
        }
    },

    onStop() {
        patcher.unpatchAll();
        console.log("[AntiReDoS] 비활성화됨");
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);
