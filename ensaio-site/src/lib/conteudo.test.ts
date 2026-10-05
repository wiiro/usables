import { describe, expect, it } from "vitest";
import { mapearConteudo, urlSegura } from "./conteudo";

describe("urlSegura", () => {
  it("aceita http(s) e caminhos do próprio site", () => {
    expect(urlSegura("https://exemplo.com/a.jpg")).toBe("https://exemplo.com/a.jpg");
    expect(urlSegura(" http://localhost:9000/static/x.png ")).toBe("http://localhost:9000/static/x.png");
    expect(urlSegura("/brand/simbolo.png")).toBe("/brand/simbolo.png");
  });
  it("bloqueia esquemas perigosos e entradas inválidas", () => {
    expect(urlSegura("javascript:alert(1)")).toBeUndefined();
    expect(urlSegura("data:text/html;base64,AAAA")).toBeUndefined();
    expect(urlSegura("//evil.com/x")).toBeUndefined();
    expect(urlSegura("ftp://x")).toBeUndefined();
    expect(urlSegura("")).toBeUndefined();
    expect(urlSegura(123)).toBeUndefined();
    expect(urlSegura(null)).toBeUndefined();
  });
});

describe("mapearConteudo", () => {
  it("converte o objeto do painel e descarta o que é inválido", () => {
    const c = mapearConteudo({
      hero_video_url: "https://x.com/v.mp4",
      hero_poster_url: "javascript:x",
      instagram_usuario: "  @ensaio  ",
      instagram_url: "https://instagram.com/ensaio",
      instagram_imagens: ["https://x.com/1.jpg", "javascript:y", 5, "/local.jpg"],
    });
    expect(c.heroVideoUrl).toBe("https://x.com/v.mp4");
    expect(c.heroPosterUrl).toBeUndefined();
    expect(c.instagramUsuario).toBe("@ensaio");
    expect(c.instagramImagens).toEqual(["https://x.com/1.jpg", "/local.jpg"]);
  });
  it("objeto vazio resulta em padrões seguros", () => {
    expect(mapearConteudo({})).toEqual({
      heroVideoUrl: undefined,
      heroPosterUrl: undefined,
      instagramUsuario: undefined,
      instagramUrl: undefined,
      instagramImagens: [],
    });
  });
  it("limita a 12 imagens", () => {
    const muitas = Array.from({ length: 30 }, (_, i) => `https://x.com/${i}.jpg`);
    expect(mapearConteudo({ instagram_imagens: muitas }).instagramImagens).toHaveLength(12);
  });
});
