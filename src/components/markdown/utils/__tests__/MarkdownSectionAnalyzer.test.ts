import { MarkdownSectionAnalyzer } from '../../../../utils/MarkdownSections';

describe('MarkdownSectionAnalyzer - root section parsing', () => {
  const markdown = `# A
contentA line1
contentA line2
# B
contentB1
contentB2
`;
  const analyzer = new MarkdownSectionAnalyzer(markdown);

  it('has correct lines count including trailing empty line', () => {
    const lines = analyzer.getAllLines();
    // markdown ends with a newline, resulting in an extra empty line
    expect(lines.length).toBe(7);
  });

  it('identifies first root section (A)', () => {
    // Section id is section-<lineIndex>
    const sectionA = analyzer.getSectionById('section-0');
    expect(sectionA).toBeDefined();
    expect(sectionA!.level).toBe(1);
    expect(sectionA!.start).toBe(0);
    // Content should be lines 1 and 2
    const contentA = analyzer.getSectionContent(sectionA!);
    expect(contentA).toEqual(['contentA line1', 'contentA line2']);
  });

  it('identifies second root section (B)', () => {
    const sectionB = analyzer.getSectionById('section-3');
    expect(sectionB).toBeDefined();
    expect(sectionB!.level).toBe(1);
    expect(sectionB!.start).toBe(3);
    const contentB = analyzer.getSectionContent(sectionB!);
    // includes trailing empty line
    expect(contentB).toEqual(['contentB1', 'contentB2', '']);
  });
});
