declare class Fraction
{
	constructor(value: number);
	constructor(numerator: number, denominator: number);

	add(frac: Fraction): Fraction;
	sub(frac: Fraction): Fraction;
	mul(frac: Fraction): Fraction;

	valueOf(): number;
}
