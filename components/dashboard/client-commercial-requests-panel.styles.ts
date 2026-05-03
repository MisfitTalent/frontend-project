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
  detailsText: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
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
  itemCard: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding: ${token.paddingMD}px;
  `,
  itemFooter: css`
    color: ${token.colorTextQuaternary} !important;
    display: block;
    font-size: ${token.fontSizeSM}px;
  `,
  itemHeader: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  itemTitle: css`
    margin: 0 !important;
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  summaryCard: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    padding: ${token.paddingMD}px;
  `,
  summaryGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  title: css`
    margin: 0 !important;
  `,
  twoColumnFields: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
}));
