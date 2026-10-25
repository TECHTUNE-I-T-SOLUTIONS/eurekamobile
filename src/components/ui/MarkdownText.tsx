import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface MarkdownTextProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownText({ content, isUser = false }: MarkdownTextProps) {
  const { theme } = useTheme();

  const textColor = isUser
    ? theme.colors.primaryForeground
    : theme.colors.textPrimary;
  const secondaryTextColor = isUser
    ? theme.colors.primaryForeground
    : theme.colors.textSecondary;
  const codeBgColor = isUser ? 'rgba(255,255,255,0.2)' : (theme.colors.surfaceVariant || '#1E293B');
  const codeTextColor = isUser ? theme.colors.primaryForeground : (theme.isDark ? '#E2E8F0' : '#1E293B');

  // Split content by code blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIndex) => {
        if (!block) return null;

        // Check if it's a code block
        if (block.startsWith('```') && block.endsWith('```')) {
          const rawCode = block.slice(3, -3);
          const firstLineEnd = rawCode.indexOf('\n');
          let language = '';
          let codeContent = rawCode;

          if (firstLineEnd !== -1) {
            const possibleLang = rawCode.slice(0, firstLineEnd).trim();
            if (/^[a-zA-Z0-9_+#-]+$/.test(possibleLang)) {
              language = possibleLang;
              codeContent = rawCode.slice(firstLineEnd + 1);
            }
          }

          return (
            <View
              key={`code-${blockIndex}`}
              style={[
                styles.codeBlock,
                {
                  backgroundColor: isUser ? 'rgba(0,0,0,0.25)' : '#0F172A',
                  borderColor: isUser ? 'rgba(255,255,255,0.2)' : theme.colors.surfaceBorder,
                },
              ]}
            >
              {language ? (
                <View style={styles.codeHeader}>
                  <Text style={[styles.codeLang, { color: '#60A5FA' }]}>
                    {language.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.codeText, { color: '#F8FAFC' }]}>
                {codeContent.trim()}
              </Text>
            </View>
          );
        }

        // Process line-by-line block elements (Headers, Lists, Blockquotes, Paragraphs)
        const lines = block.split('\n');
        const renderedLines: React.ReactNode[] = [];

        lines.forEach((line, lineIndex) => {
          const trimmed = line.trim();
          if (!trimmed) {
            renderedLines.push(
              <View key={`space-${blockIndex}-${lineIndex}`} style={{ height: 6 }} />
            );
            return;
          }

          // Headers
          if (trimmed.startsWith('# ')) {
            const headerText = trimmed.replace(/^#\s+/, '');
            renderedLines.push(
              <Text key={`h1-${blockIndex}-${lineIndex}`} style={styles.h1}>
                {parseInlineFormatting(headerText, styles.h1Text, textColor, codeBgColor, codeTextColor)}
              </Text>
            );
            return;
          }

          if (trimmed.startsWith('## ')) {
            const headerText = trimmed.replace(/^##\s+/, '');
            renderedLines.push(
              <Text key={`h2-${blockIndex}-${lineIndex}`} style={styles.h2}>
                {parseInlineFormatting(headerText, styles.h2Text, textColor, codeBgColor, codeTextColor)}
              </Text>
            );
            return;
          }

          if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
            const headerText = trimmed.replace(/^#{3,4}\s+/, '');
            renderedLines.push(
              <Text key={`h3-${blockIndex}-${lineIndex}`} style={styles.h3}>
                {parseInlineFormatting(headerText, styles.h3Text, textColor, codeBgColor, codeTextColor)}
              </Text>
            );
            return;
          }

          // Blockquote
          if (trimmed.startsWith('> ')) {
            const quoteText = trimmed.replace(/^>\s+/, '');
            renderedLines.push(
              <View
                key={`quote-${blockIndex}-${lineIndex}`}
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: isUser ? '#FFFFFF' : theme.colors.primary,
                    backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text style={styles.paragraph}>
                  {parseInlineFormatting(quoteText, styles.bodyText, secondaryTextColor, codeBgColor, codeTextColor)}
                </Text>
              </View>
            );
            return;
          }

          // Bullet List Item
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
            const bulletText = trimmed.replace(/^[-*+]\s+/, '');
            renderedLines.push(
              <View key={`bullet-${blockIndex}-${lineIndex}`} style={styles.listItemRow}>
                <Text style={[styles.bulletPoint, { color: textColor }]}>•</Text>
                <Text style={[styles.listText, { color: textColor }]}>
                  {parseInlineFormatting(bulletText, styles.bodyText, textColor, codeBgColor, codeTextColor)}
                </Text>
              </View>
            );
            return;
          }

          // Numbered List Item
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numberedMatch) {
            const num = numberedMatch[1];
            const numText = numberedMatch[2];
            renderedLines.push(
              <View key={`num-${blockIndex}-${lineIndex}`} style={styles.listItemRow}>
                <Text style={[styles.numberPrefix, { color: textColor }]}>{num}.</Text>
                <Text style={[styles.listText, { color: textColor }]}>
                  {parseInlineFormatting(numText, styles.bodyText, textColor, codeBgColor, codeTextColor)}
                </Text>
              </View>
            );
            return;
          }

          // Regular Paragraph
          renderedLines.push(
            <Text key={`p-${blockIndex}-${lineIndex}`} style={styles.paragraph}>
              {parseInlineFormatting(trimmed, styles.bodyText, textColor, codeBgColor, codeTextColor)}
            </Text>
          );
        });

        return <View key={`block-${blockIndex}`}>{renderedLines}</View>;
      })}
    </View>
  );
}

function parseInlineFormatting(
  text: string,
  baseStyle: any,
  textColor: string,
  codeBg: string,
  codeTextColor: string
): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|___[^_]+___|__[^_]+__|_[^_]+_)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const code = part.slice(1, -1);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              backgroundColor: codeBg,
              color: codeTextColor,
              fontSize: (baseStyle.fontSize || 14) * 0.9,
              paddingHorizontal: 5,
              paddingVertical: 1,
              borderRadius: 4,
            },
          ]}
        >
          {code}
        </Text>
      );
    }

    if (
      (part.startsWith('***') && part.endsWith('***') && part.length > 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length > 6)
    ) {
      const content = part.slice(3, -3);
      return (
        <Text key={index} style={[baseStyle, { color: textColor, fontWeight: '700', fontStyle: 'italic' }]}>
          {content}
        </Text>
      );
    }

    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      const content = part.slice(2, -2);
      return (
        <Text key={index} style={[baseStyle, { color: textColor, fontWeight: '700' }]}>
          {content}
        </Text>
      );
    }

    if (
      (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length > 2)
    ) {
      const content = part.slice(1, -1);
      return (
        <Text key={index} style={[baseStyle, { color: textColor, fontStyle: 'italic' }]}>
          {content}
        </Text>
      );
    }

    return (
      <Text key={index} style={[baseStyle, { color: textColor }]}>
        {part}
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraph: {
    marginVertical: 3,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
  },
  h1: {
    marginVertical: 6,
  },
  h1Text: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  h2: {
    marginVertical: 5,
  },
  h2Text: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  h3: {
    marginVertical: 4,
  },
  h3Text: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 4,
    marginVertical: 6,
    borderRadius: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 21,
    marginRight: 8,
    fontWeight: '700',
  },
  numberPrefix: {
    fontSize: 14,
    lineHeight: 21,
    marginRight: 6,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
  },
  codeBlock: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  codeHeader: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  codeLang: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
});
