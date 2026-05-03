import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
  `,
  clientFocusHeader: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginMD}px;
    justify-content: space-between;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  headerCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  modalBody: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding-top: ${token.paddingXS}px;
  `,
  mutedParagraph: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
