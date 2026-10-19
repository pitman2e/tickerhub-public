using FluentValidation.TestHelper;
using StockHub.Controllers.Transaction;
using Xunit;

namespace UnitTests.Controllers.Transaction;

public class TransactionModifyDtoValidatorTest
{
    private readonly TestTransactionModifyDtoValidator _validator = new();

    [Fact]
    public void Validate_WhenStringFieldsExceedSchemaLimits_ShouldHaveErrors()
    {
        var result = _validator.TestValidate(new TransactionModifyDto
        {
            PortfolioId = new string('P', 21),
            StockId = new string('S', 21),
            TranType = new string('T', 11)
        });

        result.ShouldHaveValidationErrorFor(x => x.PortfolioId);
        result.ShouldHaveValidationErrorFor(x => x.StockId);
        result.ShouldHaveValidationErrorFor(x => x.TranType);
    }

    [Fact]
    public void Validate_WhenNumericFieldsExceedPrecisionOrScale_ShouldHaveErrors()
    {
        var result = _validator.TestValidate(new TransactionModifyDto
        {
            TranType = "BUY",
            TxCount = 1.0000001m,
            UnitAmt = 10000000m,
            HandlingFee = -0.0000001m,
            AccruedInterest = -0.0000001m,
            Ytm = 0.0000001m,
            Tax = -0.0000001m
        });

        result.ShouldHaveValidationErrorFor(x => x.TxCount);
        result.ShouldHaveValidationErrorFor(x => x.UnitAmt);
        result.ShouldHaveValidationErrorFor(x => x.HandlingFee);
        result.ShouldHaveValidationErrorFor(x => x.AccruedInterest);
        result.ShouldHaveValidationErrorFor(x => x.Ytm);
        result.ShouldHaveValidationErrorFor(x => x.Tax);
    }

    [Fact]
    public void Validate_WhenNumericValuesHaveEitherSign_ShouldNotHaveSignErrors()
    {
        var result = _validator.TestValidate(new TransactionModifyDto
        {
            TranType = "BUY",
            TxCount = -1,
            UnitAmt = -1,
            HandlingFee = 1,
            AccruedInterest = 1,
            Ytm = -1,
            Tax = 1
        });

        result.ShouldNotHaveValidationErrorFor(x => x.TxCount);
        result.ShouldNotHaveValidationErrorFor(x => x.UnitAmt);
        result.ShouldNotHaveValidationErrorFor(x => x.HandlingFee);
        result.ShouldNotHaveValidationErrorFor(x => x.AccruedInterest);
        result.ShouldNotHaveValidationErrorFor(x => x.Ytm);
        result.ShouldNotHaveValidationErrorFor(x => x.Tax);
    }

    private sealed class TestTransactionModifyDtoValidator : TransactionModifyDtoValidator<TransactionModifyDto>;
}