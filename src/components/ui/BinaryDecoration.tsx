export default function BinaryDecoration({ className = "" }) {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 font-mono text-[10px] text-[var(--primary)] select-none">
          01001101 01111001 00100000 01101111 01101110 01101100 01101001 01101110 01100101 00100000 01100011 01101111 01110010 01101110 01100101 01110010 00100001 
        </div>
    </div>
  );
}
