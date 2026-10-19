using System.Linq;
using FluentValidation;
using StockHub.Database;

namespace StockHub.Controllers.Transaction;

public abstract class TransactionModifyDtoValidator<T> : AbstractValidator<T> where T : TransactionModifyDto
{
    private const decimal MaxNumeric13Scale6 = 9_999_999.999999m;
    private const string Numeric13Scale6Message =
        "Value must be between -10M and 10M with up to 6 decimals";

    protected TransactionModifyDtoValidator()
    {
        RuleFor(x => x.PortfolioId)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.StockId)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.TranType)
            .NotEmpty()
            .MaximumLength(10)
            .Must((dto, tranType) => StockTransaction.TRANTYPES.Contains(tranType))
            .WithMessage("Invalid Transaction Type");

        RuleFor(x => x.TxCount)
            .Must(IsNumeric13Scale6)
            .WithMessage(Numeric13Scale6Message);

        RuleFor(x => x.UnitAmt)
            .Must(IsNumeric13Scale6)
            .WithMessage(Numeric13Scale6Message);

        RuleFor(x => x.UnitAmt)
            .Equal(1)
            .WithMessage("Tx Price must be 1 for CASH")
            .When(x => x.TranType == StockTransaction.TRANTYPE_CASH);

        RuleFor(x => x.AccruedInterest)
            .Must(value => !value.HasValue || IsNumeric13Scale6(value.Value))
            .WithMessage(Numeric13Scale6Message);

        RuleFor(x => x.Ytm)
            .Must(value => !value.HasValue || IsNumeric13Scale6(value.Value))
            .WithMessage(Numeric13Scale6Message);

        RuleFor(x => x.HandlingFee)
            .Must(value => !value.HasValue || IsNumeric13Scale6(value.Value))
            .WithMessage(Numeric13Scale6Message);

        RuleFor(x => x.Tax)
            .Must(value => !value.HasValue || IsNumeric13Scale6(value.Value))
            .WithMessage(Numeric13Scale6Message);
    }

    private static bool IsNumeric13Scale6(decimal value) =>
        value >= -MaxNumeric13Scale6 &&
        value <= MaxNumeric13Scale6 &&
        decimal.Round(value, 6) == value;
}