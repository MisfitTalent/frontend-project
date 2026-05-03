import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  actionBar: css`
    justify-content: space-between;
    margin-top: ${token.marginMD}px !important;
    width: 100%;
  `,
  board: css`
    align-items: start;
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));

    @media (max-width: 1279px) {
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: ${token.paddingXS}px;
      scroll-snap-type: x proximity;
    }
  `,
  card: css`
    border-color: ${token.colorBorderSecondary};
  `,
  countBadge: css`
    background: ${token.colorFillSecondary};
    border-radius: 9999px;
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    padding: ${token.paddingXXS}px ${token.paddingSM}px;
  `,
  extraText: css`
    color: ${token.colorTextDescription} !important;
  `,
  emptyState: css`
    align-items: center;
    background: rgba(255, 255, 255, 0.72);
    border: 1px dashed rgba(203, 213, 225, 0.95);
    border-radius: ${token.borderRadiusLG}px;
    color: rgb(148 163 184);
    display: flex;
    justify-content: center;
    min-height: 7rem;
    padding: ${token.paddingMD}px;
    text-align: center;
  `,
  itemAccent: css`
    display: block;
    height: 0.375rem;
    margin-bottom: ${token.marginSM}px;
    width: 100%;
  `,
  itemCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 1.15rem;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
    padding: ${token.paddingMD}px;
  `,
  itemTitle: css`
    font-size: ${token.fontSizeSM}px !important;
    line-height: 1.25rem !important;
    margin-bottom: ${token.marginXXS}px !important;
  `,
  itemGrab: css`
    cursor: grab;
  `,
  itemValue: css`
    color: ${token.colorWarning} !important;
    font-size: ${token.fontSizeSM}px !important;
    font-weight: ${token.fontWeightStrong} !important;
  `,
  laneHeader: css`
    align-items: center;
    display: flex;
    gap: ${token.marginXS}px;
  `,
  laneHeaderRow: css`
    align-items: center;
    display: flex;
    gap: ${token.marginSM}px;
    justify-content: space-between;
    margin-bottom: ${token.marginSM}px;
  `,
  lane: css`
    max-width: none;
    min-width: 0;

    @media (max-width: 1279px) {
      flex: 0 0 min(82vw, 260px);
      max-width: min(82vw, 260px);
      min-width: min(82vw, 260px);
      scroll-snap-align: start;
    }
  `,
  laneBody: css`
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.96) 100%);
    border: 1px solid rgba(203, 213, 225, 0.95);
    border-radius: 1.5rem;
    height: 31rem;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0.9rem;

    @media (max-width: 1023px) {
      height: 26rem;
    }
  `,
  laneBodyActive: css`
    background: linear-gradient(180deg, rgba(236, 244, 255, 0.98) 0%, rgba(219, 234, 254, 0.92) 100%);
    border-color: rgba(79, 124, 172, 0.85);
    box-shadow: inset 0 0 0 1px rgba(79, 124, 172, 0.18);
  `,
  laneList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  metadataKey: css`
    color: ${token.colorTextQuaternary} !important;
    font-size: 11px !important;
    font-weight: ${token.fontWeightStrong} !important;
    letter-spacing: 0.08em;
    min-width: 0;
    text-transform: uppercase;
  `,
  metadataList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    margin-top: ${token.marginSM}px;
  `,
  metadataRow: css`
    align-items: flex-start;
    display: flex;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  metadataValue: css`
    color: ${token.colorTextSecondary} !important;
    flex: 1;
    font-size: ${token.fontSizeSM}px !important;
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: right;
  `,
  stageDot: css`
    display: block;
    height: 0.75rem;
    width: 0.75rem;
  `,
}));
