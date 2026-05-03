import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  fileHint: css`
    color: ${token.colorTextDescription} !important;
  `,
  fileMeta: css`
    color: ${token.colorTextDescription} !important;
    display: block;
    font-size: ${token.fontSizeSM}px !important;
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
  modalForm: css`
    padding-top: ${token.paddingSM}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  uploadBox: css`
    background: ${token.colorFillAlter};
    border: 1px dashed ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  uploadCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
