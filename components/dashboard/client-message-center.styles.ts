import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
    height: 100%;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  header: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  headerCopy: css`
    display: flex;
    flex: 1 1 320px;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    min-width: 0;
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  messageCard: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding: ${token.paddingMD}px;
  `,
  messageFooter: css`
    color: ${token.colorTextQuaternary} !important;
    display: block;
    font-size: ${token.fontSizeSM}px;
  `,
  messageHeader: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  messageText: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
  `,
  messageTitle: css`
    margin: 0 !important;
  `,
  metaGroup: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
