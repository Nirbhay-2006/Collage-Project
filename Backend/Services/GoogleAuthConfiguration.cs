namespace ExamNest.Services
{
    public class GoogleAuthConfiguration : IGoogleAuthConfiguration
    {
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;

        public GoogleAuthConfiguration(IConfiguration configuration, IHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        public string? GetFrontendClientId()
        {
            return GetFrontendCandidates().FirstOrDefault();
        }

        public string[] GetAllowedAudiences()
        {
            return GetAudienceCandidates().ToArray();
        }

        private IEnumerable<string> GetFrontendCandidates()
        {
            return NormalizeCandidates(new[]
            {
                _configuration["GoogleAuth:FrontendClientId"],
                _configuration["Authentication:Google:ClientId"],
                _configuration["GoogleAuth:ClientId"]
            });
        }

        private IEnumerable<string> GetAudienceCandidates()
        {
            var configuredClientIds = _configuration.GetSection("GoogleAuth:AllowedClientIds").Get<string[]>() ?? Array.Empty<string>();
            return NormalizeCandidates(configuredClientIds
                .Append(_configuration["GoogleAuth:FrontendClientId"])
                .Append(_configuration["GoogleAuth:ClientId"])
                .Append(_configuration["Authentication:Google:ClientId"]));
        }

        private IEnumerable<string> NormalizeCandidates(IEnumerable<string?> sourceCandidates)
        {
            var candidates = sourceCandidates
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!.Trim())
                .Where(id => !IsPlaceholder(id))
                .Distinct(StringComparer.Ordinal);

            if (_environment.IsDevelopment())
            {
                return candidates;
            }

            // In non-development, only allow Google Web client IDs.
            return candidates.Where(id => id.EndsWith(".apps.googleusercontent.com", StringComparison.OrdinalIgnoreCase));
        }

        private static bool IsPlaceholder(string value)
        {
            return value.Contains("YOUR_GOOGLE_CLIENT_ID", StringComparison.OrdinalIgnoreCase)
                || value.Equals("CHANGE_ME", StringComparison.OrdinalIgnoreCase);
        }
    }
}
