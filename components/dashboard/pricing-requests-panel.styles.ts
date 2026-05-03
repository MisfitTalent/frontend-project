import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  fieldGrid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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
    flex-direction: column;
    gap: ${token.marginXXS}px;
    min-width: 0;
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
