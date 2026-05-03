import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  fieldGrid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
}));
