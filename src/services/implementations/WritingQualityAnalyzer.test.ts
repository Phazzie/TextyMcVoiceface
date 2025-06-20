import { WritingQualityAnalyzer } from './WritingQualityAnalyzer';
import { ColorPaletteResult, ContractResult } from '../../types/contracts';

describe('WritingQualityAnalyzer', () => {
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    analyzer = new WritingQualityAnalyzer();
  });

  describe('generateColorPalette', () => {
    // Predefined colors for easy reference in tests, matching a subset of the implementation
    const PREDEFINED_COLORS_MAP: { [key: string]: string } = {
      "red": "#FF0000",
      "blue": "#0000FF",
      "green": "#008000",
      "yellow": "#FFFF00",
      "black": "#000000",
      "white": "#FFFFFF",
      "purple": "#800080",
      "orange": "#FFA500",
      "pink": "#FFC0CB",
      "brown": "#A52A2A",
      "gray": "#808080",
      "silver": "#C0C0C0",
      "gold": "#FFD700",
      "forest green": "#228B22",
      "sky blue": "#87CEEB",
      "sun-yellow": "#FFDB58"
    };

    it('should return an empty palette and appropriate message for empty input', async () => {
      const result = await analyzer.generateColorPalette("");
      expect(result.success).toBe(true);
      expect(result.data?.palette).toEqual([]);
      expect(result.data?.message).toBe("Input text is empty. No colors to analyze.");
    });

    it('should return an empty palette and appropriate message for whitespace input', async () => {
      const result = await analyzer.generateColorPalette("   \n\t   ");
      expect(result.success).toBe(true);
      expect(result.data?.palette).toEqual([]);
      expect(result.data?.message).toBe("Input text is empty. No colors to analyze.");
    });

    it('should return an empty palette and message when no colors are found', async () => {
      const text = "This text has no recognizable colors.";
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      expect(result.data?.palette).toEqual([]);
      expect(result.data?.message).toBe("No predefined colors found in the text.");
    });

    it('should correctly identify and count colors with different casings', async () => {
      const text = "Red RED rEd blue Blue GREEN green"; // Red:3, Blue:2, Green:2
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette).toContainEqual({ color: "red", hex: PREDEFINED_COLORS_MAP["red"], frequency: 3 });
      expect(palette).toContainEqual({ color: "blue", hex: PREDEFINED_COLORS_MAP["blue"], frequency: 2 });
      expect(palette).toContainEqual({ color: "green", hex: PREDEFINED_COLORS_MAP["green"], frequency: 2 });
      expect(palette.length).toBe(3);
      expect(result.data?.message).toContain("Found 3 unique color(s)");
    });

    it('should correctly identify basic colors and their frequencies', async () => {
      const text = "The quick brown fox jumps over the lazy red dog. The sky is blue.";
      // brown: 1, red: 1, blue: 1
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette).toContainEqual({ color: "brown", hex: PREDEFINED_COLORS_MAP["brown"], frequency: 1 });
      expect(palette).toContainEqual({ color: "red", hex: PREDEFINED_COLORS_MAP["red"], frequency: 1 });
      expect(palette).toContainEqual({ color: "blue", hex: PREDEFINED_COLORS_MAP["blue"], frequency: 1 });
      expect(palette.length).toBe(3);
      // Ensure correct sorting
      expect(palette[0].frequency >= (palette[1]?.frequency ?? 0)).toBe(true);
      expect(palette[1]?.frequency >= (palette[2]?.frequency ?? 0)).toBe(true);
      expect(result.data?.message).toContain("Found 3 unique color(s).");
    });

    it('should sort colors by frequency in descending order', async () => {
      const text = "blue red blue green red blue yellow red red blue";
      // blue: 4, red: 4, green: 1, yellow: 1
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette.length).toBe(4);
      expect(palette[0].frequency).toBe(4); // Either blue or red
      expect(palette[1].frequency).toBe(4); // The other one with freq 4
      expect(palette[2].frequency).toBe(1); // Either green or yellow
      expect(palette[3].frequency).toBe(1); // The other one with freq 1

      const colorNames = palette.map(p => p.color);
      expect(colorNames).toContain("blue");
      expect(colorNames).toContain("red");
      expect(colorNames).toContain("green");
      expect(colorNames).toContain("yellow");
      expect(result.data?.message).toContain("Found 4 unique color(s).");
    });

    it('should return all found colors if fewer than 5', async () => {
      const text = "pink orange black"; // pink:1, orange:1, black:1
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette.length).toBe(3);
      expect(palette).toContainEqual({ color: "pink", hex: PREDEFINED_COLORS_MAP["pink"], frequency: 1 });
      expect(palette).toContainEqual({ color: "orange", hex: PREDEFINED_COLORS_MAP["orange"], frequency: 1 });
      expect(palette).toContainEqual({ color: "black", hex: PREDEFINED_COLORS_MAP["black"], frequency: 1 });
      expect(result.data?.message).toContain("Found 3 unique color(s).");
    });

    it('should return top 5 colors if 5 to 10 colors are found', async () => {
      const text = "red red red red red blue blue blue blue green green green yellow yellow orange";
      // red:5, blue:4, green:3, yellow:2, orange:1 (total 5 unique)
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette.length).toBe(5);
      expect(palette[0]).toEqual({ color: "red", hex: PREDEFINED_COLORS_MAP["red"], frequency: 5 });
      expect(palette[1]).toEqual({ color: "blue", hex: PREDEFINED_COLORS_MAP["blue"], frequency: 4 });
      expect(palette[2]).toEqual({ color: "green", hex: PREDEFINED_COLORS_MAP["green"], frequency: 3 });
      expect(palette[3]).toEqual({ color: "yellow", hex: PREDEFINED_COLORS_MAP["yellow"], frequency: 2 });
      expect(palette[4]).toEqual({ color: "orange", hex: PREDEFINED_COLORS_MAP["orange"], frequency: 1 });
      expect(result.data?.message).toContain("Found 5 unique color(s).");
    });

    it('should return top N (between 5 and 10) colors if more than 10 colors are found', async () => {
      // Test with 12 colors to ensure top N (implementation detail: currently 10) are returned
      let text = "red ".repeat(12);        // red: 12
      text += "blue ".repeat(11);      // blue: 11
      text += "green ".repeat(10);    // green: 10
      text += "yellow ".repeat(9);   // yellow: 9
      text += "black ".repeat(8);     // black: 8
      text += "white ".repeat(7);     // white: 7
      text += "purple ".repeat(6);   // purple: 6
      text += "orange ".repeat(5);   // orange: 5
      text += "pink ".repeat(4);       // pink: 4
      text += "brown ".repeat(3);     // brown: 3
      text += "gray ".repeat(2);       // gray: 2
      text += "silver ".repeat(1);     // silver: 1 (12 colors total)

      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      // The implementation slices topN = Math.min(Math.max(5, sortedColors.length < 5 ? sortedColors.length : 10), sortedColors.length);
      // If sortedColors.length (12) < 5 is false, then Math.max(5,10) = 10. Then Math.min(10, 12) = 10.
      expect(palette.length).toBe(10);
      expect(palette[0]).toEqual({ color: "red", hex: PREDEFINED_COLORS_MAP["red"], frequency: 12 });
      expect(palette[1]).toEqual({ color: "blue", hex: PREDEFINED_COLORS_MAP["blue"], frequency: 11 });
      // ... down to the 10th color
      expect(palette[9]).toEqual({ color: "brown", hex: PREDEFINED_COLORS_MAP["brown"], frequency: 3 });
      expect(result.data?.message).toContain("Found 12 unique color(s). Displaying top 10.");
    });

    it('should handle colors with multiple words like "forest green"', async () => {
      const text = "A forest green tree stands next to a sky blue lake. Also some sun-yellow flowers.";
      // forest green: 1, sky blue: 1, sun-yellow: 1
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette.length).toBe(3);
      expect(palette).toContainEqual({ color: "forest green", hex: PREDEFINED_COLORS_MAP["forest green"], frequency: 1 });
      expect(palette).toContainEqual({ color: "sky blue", hex: PREDEFINED_COLORS_MAP["sky blue"], frequency: 1 });
      expect(palette).toContainEqual({ color: "sun-yellow", hex: PREDEFINED_COLORS_MAP["sun-yellow"], frequency: 1 });
    });

    it('should not count substrings as colors (e.g., "redo" is not "red")', async () => {
      const text = "He had to redo his work. The carpet was red. She felt blue. Blueprint.";
      // red: 1, blue: 1
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      expect(palette).toContainEqual({ color: "red", hex: PREDEFINED_COLORS_MAP["red"], frequency: 1 });
      expect(palette).toContainEqual({ color: "blue", hex: PREDEFINED_COLORS_MAP["blue"], frequency: 1 });

      const redEntry = palette.find(p => p.color === "red");
      expect(redEntry?.frequency).toBe(1);

      const blueEntry = palette.find(p => p.color === "blue");
      expect(blueEntry?.frequency).toBe(1);

      expect(palette.length).toBe(2); // Only "red" and "blue" should be counted
    });

    it('should verify hex codes match predefined values', async () => {
      const text = "green silver gold";
      const result = await analyzer.generateColorPalette(text);
      expect(result.success).toBe(true);
      const palette = result.data?.palette;
      expect(palette).toBeDefined();
      if (!palette) return;

      palette.forEach(p => {
        expect(p.hex).toBe(PREDEFINED_COLORS_MAP[p.color]);
      });
    });

    it('should provide correct message when colors are found and displayed', async () => {
        const text = "red blue green";
        const result = await analyzer.generateColorPalette(text);
        expect(result.success).toBe(true);
        expect(result.data?.message).toBe("Successfully generated color palette. Found 3 unique color(s).");
    });

    it('should provide correct message when more colors found than displayed', async () => {
        let text = "red ".repeat(12) + "blue ".repeat(11) + "green ".repeat(10) + "yellow ".repeat(9) + "black ".repeat(8) + "white ".repeat(7) + "purple ".repeat(6) + "orange ".repeat(5) + "pink ".repeat(4) + "brown ".repeat(3) + "gray ".repeat(2) + "silver ".repeat(1);
        const result = await analyzer.generateColorPalette(text);
        expect(result.success).toBe(true);
        expect(result.data?.message).toBe("Successfully generated color palette. Found 12 unique color(s). Displaying top 10.");
    });

  });
});
