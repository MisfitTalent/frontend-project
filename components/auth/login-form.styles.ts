import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  alert: css`
    margin-bottom: ${token.marginLG}px;
  `,
  card: css`
    border: 0;
    box-shadow: ${token.boxShadowSecondary};
    max-width: 448px;
    width: 100%;
  `,
  helperRow: css`
    color: ${token.colorTextDescription} !important;
    display: block;
    font-size: ${token.fontSizeSM}px !important;
  `,
  helperSmall: css`
    color: ${token.colorTextTertiary} !important;
    display: block;
    font-size: ${token.fontSizeSM - 1}px !important;
  `,
  intro: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    margin-bottom: ${token.marginXL}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
  `,
  quickFill: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    padding-top: ${token.paddingXS}px;
  `,
  title: css`
    margin-bottom: 0 !important;
  `,
}));
