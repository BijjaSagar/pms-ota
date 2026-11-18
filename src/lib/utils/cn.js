// Ported from pms-ota/src/utils/cn.ts (types removed, logic unchanged).
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
export {
  cn
};
