import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
  `,
  cardGridFour: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  conversationBubble: css`
    border-radius: ${token.borderRadiusLG}px;
    max-width: min(42rem, 100%);
    padding: ${token.paddingMD}px;
  `,
  conversationBubbleClient: css`
    align-self: flex-start;
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
  `,
  conversationBubbleWorkspace: css`
    align-self: flex-end;
    background: ${token.colorPrimaryBg};
    border: 1px solid ${token.colorPrimaryBorder};
  `,
  conversationMeta: css`
    color: ${token.colorTextQuaternary} !important;
    display: block;
    font-size: ${token.fontSizeSM}px;
    margin-bottom: ${token.marginXS}px;
  `,
  conversationThread: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  filterBar: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  filterSelect: css`
    min-width: 180px;
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
  messageList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  requestQueue: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  requestQueueHeader: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  messageText: css`
    color: ${token.colorTextSecondary} !important;
    margin: 0 !important;
  `,
  metricLabel: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricText: css`
    color: ${token.colorTextSecondary} !important;
  `,
  metricTitle: css`
    margin: 0 !important;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  selectedConversationHeader: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  tableWrap: css`
    overflow: hidden;
  `,
}));
