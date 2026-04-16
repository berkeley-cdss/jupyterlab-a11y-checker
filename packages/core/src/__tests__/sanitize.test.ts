import { describe, it, expect } from "vitest";
import {
  stripHtmlTags,
  escapeHtmlAttr,
  findAllHtmlTags,
  stripHtmlComments,
  maskMathBlocks,
} from "../utils/sanitize.js";

describe("stripHtmlTags", () => {
  it("strips simple tags", () => {
    expect(stripHtmlTags("<b>bold</b>")).toBe("bold");
  });

  it("strips nested tags", () => {
    expect(stripHtmlTags("<a><b>x</b></a>")).toBe("x");
  });

  it("handles string with no tags", () => {
    expect(stripHtmlTags("plain text")).toBe("plain text");
  });
});

describe("escapeHtmlAttr", () => {
  it("escapes quotes and special chars", () => {
    expect(escapeHtmlAttr("a\"b'c")).toBe("a&quot;b&#39;c");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtmlAttr("<script>")).toBe("&lt;script&gt;");
  });
});

describe("stripHtmlComments", () => {
  it("strips a single comment", () => {
    expect(stripHtmlComments("a<!-- comment -->b")).toBe("ab");
  });

  it("strips multiple comments", () => {
    expect(stripHtmlComments("a<!-- 1 -->b<!-- 2 -->c")).toBe("abc");
  });

  it("returns input unchanged when no comments", () => {
    expect(stripHtmlComments("<b>bold</b>")).toBe("<b>bold</b>");
  });
});

describe("maskMathBlocks", () => {
  it("masks a single-line $$...$$ block with spaces", () => {
    expect(maskMathBlocks("$$ x = y $$")).toBe("           ");
  });

  it("preserves length and newlines for multi-line math", () => {
    const input = "$$\n\\hat{y}\n=\n\\theta_0\n$$";
    const masked = maskMathBlocks(input);
    expect(masked).toHaveLength(input.length);
    expect(masked).toBe("  \n       \n \n        \n  ");
  });

  it("leaves text outside math blocks untouched", () => {
    expect(maskMathBlocks("foo $$x$$ bar")).toBe("foo       bar");
  });

  it("leaves an unclosed $$ untouched (conservative)", () => {
    const input = "before\n$$\n\\hat{y}\n=\nrest";
    expect(maskMathBlocks(input)).toBe(input);
  });

  it("masks multiple math blocks independently", () => {
    expect(maskMathBlocks("$$a$$ middle $$b$$")).toBe("      middle      ");
  });

  it("returns input unchanged when there are no $$ delimiters", () => {
    expect(maskMathBlocks("# Heading\n\nplain text")).toBe(
      "# Heading\n\nplain text",
    );
  });
});

describe("findAllHtmlTags", () => {
  it("finds a tag pair", () => {
    const result = findAllHtmlTags("<a>x</a>", "a");
    expect(result).toHaveLength(1);
    expect(result[0].match).toBe("<a>x</a>");
  });

  it("finds multiple tag pairs", () => {
    const result = findAllHtmlTags("<div>a</div><div>b</div>", "div");
    expect(result).toHaveLength(2);
  });

  it("returns empty for no matches", () => {
    const result = findAllHtmlTags("<p>text</p>", "div");
    expect(result).toHaveLength(0);
  });
});
