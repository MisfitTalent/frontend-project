import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  centeredLoader: css`
    align-items: center;
    display: flex;
    justify-content: center;
    padding: ${token.paddingXL}px 0;
  `,
  formGrid: css`
    display: grid;
    gap: ${token.marginLG}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  fullWidth: css`
    width: 100%;
  `,
  itemCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  itemDescriptionRow: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      align-items: end;
      grid-template-columns: 1fr auto;
    }
  `,
  itemFieldsGrid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  `,
  itemList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  itemSummary: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginXS}px;
  `,
  itemSummaryText: css`
    color: ${token.colorTextDescription} !important;
  `,
  lineItemPanel: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  lineItemPanelHeader: css`
    margin-bottom: ${token.marginMD}px;
  `,
  lineItemPanelTitle: css`
    margin-bottom: 0 !important;
  `,
  lineItemPanelText: css`
    color: ${token.colorTextDescription} !important;
  `,
  lineItemStatus: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
  `,
  lineItemStatusLabel: css`
    color: ${token.colorTextDescription} !important;
    display: block;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  noMargin: css`
    margin-bottom: 0 !important;
  `,
  removeRow: css`
    justify-content: space-between;

    @media (min-width: 768px) {
      justify-content: flex-end;
    }
  `,
  statusTagText: css`
    color: ${token.colorTextDescription} !important;
  `,
  totalBanner: css`
    align-items: center;
    background: ${token.colorWarningBg};
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusLG}px;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
    margin-top: ${token.marginLG}px;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
  `,
  totalValue: css`
    color: ${token.colorWarning} !important;
    font-size: ${token.fontSizeHeading4}px !important;
  `,
  twoColumnSpan: css`
    @media (min-width: 1280px) {
      grid-column: span 2 / span 2;
    }
  `,
}));
