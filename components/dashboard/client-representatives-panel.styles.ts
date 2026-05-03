import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
    height: 100%;
  `,
  cardBody: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  containerCompact: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  containerFull: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
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
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  mutedParagraph: css`
    color: ${token.colorTextDescription} !important;
    margin: 0 !important;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  skillList: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
