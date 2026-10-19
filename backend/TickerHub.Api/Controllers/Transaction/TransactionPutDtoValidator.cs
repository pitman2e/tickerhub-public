using FluentValidation;

namespace StockHub.Controllers.Transaction;

public sealed class TransactionPutDtoValidator : TransactionModifyDtoValidator<TransactionPutDto>
{
    public TransactionPutDtoValidator()
    {
        RuleFor(x => x.Iden)
            .NotEmpty()
            .WithMessage("Transaction ID (iden) is required.");
        
        RuleFor(x => x.Version)
            .NotEqual(0u)
            .WithMessage("Row version is required");
    }
}