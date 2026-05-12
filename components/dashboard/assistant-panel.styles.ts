import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  actionBar: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  actionGroup: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  assistantCard: css`
    border-color: ${token.colorBorderSecondary};
    min-width: 0;
  `,
  assistantMessage: css`
    background: ${token.colorFillAlter};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorTextSecondary};
    padding: ${token.paddingMD}px;
  `,
  assistantText: css`
    color: ${token.colorTextSecondary} !important;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  emptyMessage: css`
    background: ${token.colorFillAlter};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorTextSecondary};
    padding: ${token.paddingMD}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
    margin-bottom: ${token.marginMD}px;
  `,
  headerCopy: css`
    min-width: 0;
  `,
  headerRow: css`
    align-items: center;
    display: flex;
    gap: ${token.marginXS}px;
  `,
  helperCard: css`
    border-color: ${token.colorBorderSecondary};
  `,
  helperCardBody: css`
    align-items: flex-start;
    display: flex;
    gap: ${token.marginSM}px;
  `,
  helperCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  helperList: css`
    color: ${token.colorTextSecondary};
    display: flex;
    flex-direction: column;
    font-size: ${token.fontSize}px;
    gap: ${token.marginSM}px;
  `,
  helperText: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
  `,
  introText: css`
    color: ${token.colorTextSecondary} !important;
  `,
  layout: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 1280px) {
      grid-template-columns: 1.35fr 0.65fr;
    }
  `,
  link: css`
    color: ${token.colorLink};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    transition: color ${token.motionDurationMid};

    &:hover {
      color: ${token.colorPrimaryHover};
    }
  `,
  messageBlock: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  messageContainer: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  mutationCard: css`
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
  `,
  mutationCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    min-width: 0;
  `,
  mutationHeader: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  mutationInfo: css`
    align-items: flex-start;
    display: flex;
    gap: ${token.marginXS}px;
    min-width: 0;
  `,
  mutationText: css`
    color: ${token.colorTextDescription} !important;
    display: block;
    font-size: ${token.fontSizeSM}px !important;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  panelText: css`
    color: ${token.colorTextDescription} !important;
    display: block;
  `,
  rightColumn: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  statusIcon: css`
    color: ${token.colorWarning};
    margin-top: ${token.marginXXS}px;
  `,
  submitRow: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    margin-top: ${token.marginLG}px;
  `,
  suggestionList: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  title: css`
    color: ${token.colorText} !important;
    margin: 0 !important;
  `,
  traceCard: css`
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
  `,
  traceDetails: css`
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
    margin-top: ${token.marginSM}px;
    padding: ${token.paddingSM}px;
  `,
  tracePre: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    margin-top: ${token.marginSM}px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  tracePreMuted: css`
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
    margin-top: ${token.marginSM}px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  traceSummary: css`
    color: ${token.colorTextSecondary};
    cursor: pointer;
    font-weight: ${token.fontWeightStrong};
  `,
  userMessage: css`
    background: #1f365c;
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorWhite};
    padding: ${token.paddingMD}px;
  `,
  userText: css`
    color: ${token.colorWhite} !important;
  `,
}));
