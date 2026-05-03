import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
  `,
  cardGridFour: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  cardGridThree: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  filterBar: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  filterSelectLg: css`
    min-width: 220px;
  `,
  filterSelectMd: css`
    min-width: 180px;
  `,
  filterSelectXl: css`
    min-width: 240px;
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
  `,
  messageHeader: css`
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  messageList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  messageText: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
  `,
  messageTitle: css`
    margin: 0 !important;
  `,
  metricLabel: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricText: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricTitle: css`
    color: ${token.colorText} !important;
    margin: ${token.marginXS}px 0 0 !important;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  sectionText: css`
    color: ${token.colorTextDescription} !important;
  `,
  sectionTitle: css`
    margin: 0 !important;
  `,
  tableWrap: css`
    margin-top: ${token.marginMD}px;
  `,
}));
