// 全局 SVG patterns 注册
// 用 ?raw import 把 SVG 字符串原样塞进 defs，避免逐属性改 camelCase（32 个 pattern）
// 注册一次后，文档里任意 SVG 通过 fill="url(#g-xxx)" 都能引用
import rawDefs from '../../lib/litho-patterns.raw.svg?raw';

export function LithoPatterns() {
  return (
    <svg
      width={0}
      height={0}
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: rawDefs }} />
    </svg>
  );
}
