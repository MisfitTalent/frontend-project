import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  actionGroup: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  blueActionButton: css`
    background: #355c7d !important;
    border-color: #355c7d !important;
    box-shadow: none !important;
    color: #fff !important;

    &:hover,
    &:focus {
      background: #4f7cac !important;
      border-color: #4f7cac !important;
      color: #fff !important;
    }
  `,
  card: css`
    border-color: rgba(79, 124, 172, 0.24);
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  input: css`
    border-color: rgba(79, 124, 172, 0.24);

    &:hover,
    &:focus,
    &.ant-input-focused {
      border-color: #355c7d;
      box-shadow: 0 0 0 2px rgba(79, 124, 172, 0.14);
    }
  `,
  messageBox: css`
    background: linear-gradient(180deg, rgba(236, 244, 255, 0.8) 0%, rgba(248, 250, 252, 1) 100%);
    border: 1px solid rgba(79, 124, 172, 0.16);
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  messageHeader: css`
    align-items: center;
    display: flex;
    gap: ${token.marginSM}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  responseText: css`
    color: ${token.colorTextSecondary} !important;
    margin-top: ${token.marginSM}px !important;
  `,
}));
