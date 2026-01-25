import Image from 'next/image';
import Link from 'next/link';

export const Logo = () => {
	return (
		<Link href="/">
			<div className=" size-fit relative shrink-0">
				<Image
					src="/logo.svg"
					alt="Logo"
					width={100}
					height={100}
				/>
			</div>
		</Link>
	);
};
